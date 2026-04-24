<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Interfaces\ComprobanteServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComprobanteApiController extends Controller
{
    public function __construct(
        private readonly ComprobanteServiceInterface $service,
    ) {}

    /** GET /api/comprobantes  — lista paginada de la institución */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['tipo', 'estado', 'contacto_id']);
        $data    = $this->service->listar(
            $request->user()->insti_id,
            $filters,
            (int) ($request->get('per_page') ?? 20),
        );

        return response()->json($data);
    }

    /** GET /api/comprobantes/contacto/{id} */
    public function porContacto(int $contactoId): JsonResponse
    {
        return response()->json($this->service->porContacto($contactoId));
    }

    /** GET /api/comprobantes/{id} — detalle de un comprobante */
    public function show(int $id): JsonResponse
    {
        $comprobante = $this->service->findById($id);
        return response()->json(['comprobante' => $comprobante->load('items')]);
    }

    /** POST /api/comprobantes — emitir nuevo comprobante */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tipo_documento'    => 'required|in:boleta,factura',
            'forma_pago'        => 'required|in:contado,credito',
            'cliente_tipo_doc'  => 'required|in:01,06',
            'cliente_num_doc'   => 'required|string|max:15',
            'cliente_nombre'    => 'required|string|max:200',
            'cliente_direccion' => 'nullable|string|max:300',
            'contacto_id'       => 'nullable|integer',
            'estu_id'           => 'nullable|integer',
            'pag_ids'           => 'required|array|min:1',
            'pag_ids.*'         => 'integer|exists:pagos,pag_id',
        ]);

        $validated['insti_id'] = $request->user()->insti_id;

        $comprobante = $this->service->emitir($validated);

        return response()->json([
            'message'     => 'Comprobante emitido correctamente.',
            'comprobante' => $comprobante->load('items'),
        ], 201);
    }

    /** POST /api/comprobantes/{id}/enviar — enviar a SUNAT */
    public function enviar(int $id): JsonResponse
    {
        $comprobante = $this->service->enviarASunat($id);

        return response()->json([
            'message'     => 'Comprobante enviado a SUNAT.',
            'comprobante' => $comprobante,
        ]);
    }

    /** POST /api/comprobantes/certificado — subir certificado .pem */
    public function subirCertificado(Request $request): JsonResponse
    {
        $request->validate([
            'certificado' => 'required|file|mimes:pem,txt|max:512',
        ]);

        $ok = $this->service->subirCertificado(
            $request->user()->insti_id,
            $request->file('certificado'),
        );

        return response()->json([
            'message' => $ok
                ? 'Certificado subido correctamente a la API SUNAT.'
                : 'El certificado se guardó localmente pero hubo un error al enviarlo a la API.',
            'ok' => $ok,
        ]);
    }

    /** POST /api/comprobantes/{id}/pdf-token — generar token temporal para PDF */
    public function generatePdfToken(int $id): JsonResponse
    {
        $comprobante = $this->service->findById($id);
        
        // Generar token temporal (válido por 5 minutos)
        $token = \Illuminate\Support\Str::random(64);
        \Illuminate\Support\Facades\Cache::put(
            "pdf_token_{$token}",
            $id,
            now()->addMinutes(5)
        );

        return response()->json(['token' => $token]);
    }

    /** GET /api/comprobantes/{id}/pdf — descargar PDF del comprobante */
    public function pdf(int $id): \Symfony\Component\HttpFoundation\Response
    {
        $comprobante = $this->service->findById($id);
        $institucion = \App\Models\InstitucionEducativa::findOrFail($comprobante->insti_id);
        
        // Obtener configuración de apariencia
        $config = \App\Models\ConfiguracionComprobante::firstOrCreate(
            ['insti_id' => $comprobante->insti_id],
            [
                'mostrar_logo' => true,
                'color_primario' => '#2563eb',
                'color_secundario' => '#1e40af',
                'color_fondo_header' => '#f8fafc',
                'color_texto_comprobante' => '#1e40af',
                'color_texto_secundario' => '#6b7280',
                'mostrar_qr' => true,
                'mostrar_hash' => true,
                'mostrar_firma_digital' => true,
                'mostrar_telefono' => true,
                'mostrar_email' => true,
                'digitos_numero' => 8,
                'tamano_fuente_base' => 11,
                'tamano_fuente_titulo' => 18,
            ]
        );

        // Generar QR Code si existe qr_info
        $qrCodeDataUri = null;
        if ($config->mostrar_qr && $comprobante->qr_info) {
            $qrCode = new \Endroid\QrCode\QrCode(
                data: $comprobante->qr_info,
                encoding: new \Endroid\QrCode\Encoding\Encoding('UTF-8'),
                errorCorrectionLevel: \Endroid\QrCode\ErrorCorrectionLevel::Low,
                size: 120,
                margin: 5,
                roundBlockSizeMode: \Endroid\QrCode\RoundBlockSizeMode::Margin
            );
            
            $writer = new \Endroid\QrCode\Writer\PngWriter();
            $qrCodeDataUri = $writer->write($qrCode)->getDataUri();
        }

        $tipoLabel = $comprobante->tipo_documento === 'boleta' ? 'BOLETA DE VENTA' : 'FACTURA';

        $html = view('pdf.comprobante', [
            'comprobante' => $comprobante->load('items'),
            'institucion' => $institucion,
            'config'      => $config,
            'tipoLabel'   => $tipoLabel,
            'qrCodeDataUri' => $qrCodeDataUri,
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'portrait');

        // Mostrar en el navegador en lugar de descargar
        return $pdf->stream("{$comprobante->serie}-{$comprobante->numero}.pdf");
    }

    /** POST /api/comprobantes/pdf-dual — generar PDF con 2 comprobantes en formato A4 media hoja */
    public function pdfDual(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $validated = $request->validate([
            'comprobante_ids' => 'required|array|size:2',
            'comprobante_ids.*' => 'integer|exists:comprobantes,id',
        ]);

        $comprobante1 = $this->service->findById($validated['comprobante_ids'][0]);
        $comprobante2 = $this->service->findById($validated['comprobante_ids'][1]);
        $institucion = \App\Models\InstitucionEducativa::findOrFail($comprobante1->insti_id);

        // Obtener configuración de apariencia
        $config = \App\Models\ConfiguracionComprobante::firstOrCreate(
            ['insti_id' => $comprobante1->insti_id],
            [
                'mostrar_logo' => true,
                'color_primario' => '#2563eb',
                'color_secundario' => '#1e40af',
                'color_fondo_header' => '#f8fafc',
                'color_texto_comprobante' => '#1e40af',
                'color_texto_secundario' => '#6b7280',
                'mostrar_qr' => true,
                'mostrar_hash' => true,
                'mostrar_firma_digital' => true,
                'mostrar_telefono' => true,
                'mostrar_email' => true,
                'digitos_numero' => 8,
                'tamano_fuente_base' => 11,
                'tamano_fuente_titulo' => 18,
            ]
        );

        // Generar QR Codes
        $qrCodeDataUri1 = null;
        $qrCodeDataUri2 = null;

        if ($config->mostrar_qr && $comprobante1->qr_info) {
            $qrCode = new \Endroid\QrCode\QrCode(
                data: $comprobante1->qr_info,
                encoding: new \Endroid\QrCode\Encoding\Encoding('UTF-8'),
                errorCorrectionLevel: \Endroid\QrCode\ErrorCorrectionLevel::Low,
                size: 120,
                margin: 5,
                roundBlockSizeMode: \Endroid\QrCode\RoundBlockSizeMode::Margin
            );
            $writer = new \Endroid\QrCode\Writer\PngWriter();
            $qrCodeDataUri1 = $writer->write($qrCode)->getDataUri();
        }

        if ($config->mostrar_qr && $comprobante2->qr_info) {
            $qrCode = new \Endroid\QrCode\QrCode(
                data: $comprobante2->qr_info,
                encoding: new \Endroid\QrCode\Encoding\Encoding('UTF-8'),
                errorCorrectionLevel: \Endroid\QrCode\ErrorCorrectionLevel::Low,
                size: 120,
                margin: 5,
                roundBlockSizeMode: \Endroid\QrCode\RoundBlockSizeMode::Margin
            );
            $writer = new \Endroid\QrCode\Writer\PngWriter();
            $qrCodeDataUri2 = $writer->write($qrCode)->getDataUri();
        }

        $tipoLabel1 = $comprobante1->tipo_documento === 'boleta' ? 'BOLETA DE VENTA' : 'FACTURA';
        $tipoLabel2 = $comprobante2->tipo_documento === 'boleta' ? 'BOLETA DE VENTA' : 'FACTURA';

        $html = view('pdf.comprobante-dual', [
            'comprobante1' => $comprobante1->load('items'),
            'comprobante2' => $comprobante2->load('items'),
            'institucion' => $institucion,
            'config' => $config,
            'tipoLabel1' => $tipoLabel1,
            'tipoLabel2' => $tipoLabel2,
            'qrCodeDataUri1' => $qrCodeDataUri1,
            'qrCodeDataUri2' => $qrCodeDataUri2,
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'portrait');

        return $pdf->download("comprobantes-dual.pdf");
    }
}
