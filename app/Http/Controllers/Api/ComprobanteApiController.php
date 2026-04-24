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
}
