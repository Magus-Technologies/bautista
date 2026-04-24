<?php

namespace App\Services\Implements;

use App\Models\Comprobante;
use App\Models\ComprobanteItem;
use App\Models\InstitucionEducativa;
use App\Models\Pago;
use App\Repositories\Interfaces\ComprobanteRepositoryInterface;
use App\Services\Interfaces\ComprobanteServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ComprobanteService implements ComprobanteServiceInterface
{
    private string $apiUrl;

    public function __construct(
        private readonly ComprobanteRepositoryInterface $repo,
    ) {
        $this->apiUrl = rtrim(config('services.sunat.api_url', 'https://magustechnologies.com/apisunat/api'), '/');
    }

    // ── Emisión ────────────────────────────────────────────────────────────

    public function emitir(array $data): Comprobante
    {
        $instiId  = $data['insti_id'];
        $instit   = InstitucionEducativa::findOrFail($instiId);
        $pagIds   = $data['pag_ids'];

        $pagos = Pago::with('concepto')
            ->whereIn('pag_id', $pagIds)
            ->where('insti_id', $instiId)
            ->get();

        if ($pagos->isEmpty()) {
            throw new \RuntimeException('No se encontraron pagos válidos para emitir.');
        }

        // Reservar correlativo dentro de una transacción
        return DB::transaction(function () use ($data, $instit, $pagos) {
            $serie  = $this->repo->obtenerSerie($data['insti_id'], $data['tipo_documento']);
            $numero = $this->repo->siguienteNumero($serie);
            $total  = $pagos->sum(fn($p) => (float) $p->pag_monto);

            $comprobante = $this->repo->create([
                'insti_id'          => $data['insti_id'],
                'tipo_documento'    => $data['tipo_documento'],
                'serie'             => $serie->serie,
                'numero'            => $numero,
                'fecha_emision'     => now()->toDateString(),
                'moneda'            => 'PEN',
                'forma_pago'        => $data['forma_pago'] ?? 'contado',
                'cliente_tipo_doc'  => $data['cliente_tipo_doc'],
                'cliente_num_doc'   => $data['cliente_num_doc'],
                'cliente_nombre'    => $data['cliente_nombre'],
                'cliente_direccion' => $data['cliente_direccion'] ?? null,
                'op_gravada'        => $total,
                'igv'               => 0,
                'total'             => $total,
                'estado'            => 'borrador',
                'endpoint'          => $instit->insti_sunat_endpoint ?? 'beta',
                'contacto_id'       => $data['contacto_id'] ?? null,
                'estu_id'           => $data['estu_id'] ?? null,
            ]);

            // Crear items y vincular pagos al comprobante
            foreach ($pagos as $pago) {
                ComprobanteItem::create([
                    'comprobante_id'  => $comprobante->id,
                    'pag_id'          => $pago->pag_id,
                    'cod_producto'    => $this->codProducto($pago),
                    'unidad'          => 'ZZ',
                    'descripcion'     => $this->descripcionItem($pago),
                    'cantidad'        => 1,
                    'precio_unitario' => (float) $pago->pag_monto,
                    'subtotal'        => (float) $pago->pag_monto,
                ]);

                $pago->update(['comprobante_id' => $comprobante->id]);
            }

            // Llamar a la API Magus para generar el XML firmado
            $comprobante = $this->llamarApiGenerar($comprobante, $instit);

            // Marcar pagos como PAGADO si el comprobante fue generado correctamente
            if ($comprobante->estado === 'generado') {
                Pago::whereIn('pag_id', $pagos->pluck('pag_id'))->update(['estatus' => 1]);
            }

            return $comprobante;
        });
    }

    public function findById(int $id): Comprobante
    {
        return $this->repo->findById($id);
    }

    // ── Envío a SUNAT ──────────────────────────────────────────────────────

    public function enviarASunat(int $comprobanteId): Comprobante
    {
        $comprobante = $this->repo->findById($comprobanteId);

        if ($comprobante->estado !== 'generado') {
            throw new \RuntimeException('El comprobante debe estar en estado "generado" para enviarlo a SUNAT.');
        }

        $instit = InstitucionEducativa::findOrFail($comprobante->insti_id);

        $payload = [
            'endpoint'           => $comprobante->endpoint,
            'ruc'                => $instit->insti_ruc,
            'usuario'            => $instit->insti_sunat_usuario,
            'clave'              => $instit->insti_sunat_clave,
            'nombre_documento'   => $comprobante->nombre_archivo,
            'contenido_documento'=> $comprobante->contenido_xml,
        ];

        try {
            $response = Http::timeout(30)->post("{$this->apiUrl}/enviar/documento/electronico", $payload);
            $body     = $response->json();

            if ($response->successful() && ($body['estado'] ?? false)) {
                $comprobante = $this->repo->update($comprobante, [
                    'estado'         => 'aceptado',
                    'sunat_response' => $body['cdr'] ?? null,
                ]);
            } else {
                $mensaje = $body['mensaje'] ?? $response->body();
                $comprobante = $this->repo->update($comprobante, [
                    'estado'         => 'rechazado',
                    'sunat_response' => $mensaje,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('ComprobanteService@enviarASunat: ' . $e->getMessage());
            $comprobante = $this->repo->update($comprobante, [
                'estado'         => 'rechazado',
                'sunat_response' => $e->getMessage(),
            ]);
        }

        return $comprobante;
    }

    // ── Listado ────────────────────────────────────────────────────────────

    public function listar(int $instiId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->repo->paginate($instiId, $filters, $perPage);
    }

    public function porContacto(int $contactoId): Collection
    {
        return $this->repo->porContacto($contactoId);
    }

    // ── Certificado ───────────────────────────────────────────────────────

    public function subirCertificado(int $instiId, UploadedFile $archivo): bool
    {
        $instit = InstitucionEducativa::findOrFail($instiId);
        $ruc    = $instit->insti_ruc;

        if (! $ruc) {
            throw new \RuntimeException('La institución no tiene RUC configurado.');
        }

        // Guardar localmente fuera del directorio público
        $path = $archivo->storeAs("certificados", "certificado_{$ruc}.pem", 'local');

        // Subir a la API Magus
        $response = Http::timeout(30)->attach(
            'certificado',
            Storage::disk('local')->get($path),
            "certificado_{$ruc}.pem"
        )->post("{$this->apiUrl}/guardar/certificado/{$ruc}");

        $ok = $response->successful();

        $instit->update([
            'insti_certificado_path'    => $path,
            'insti_certificado_enviado' => $ok,
        ]);

        return $ok;
    }

    // ── Privados ──────────────────────────────────────────────────────────

    private function llamarApiGenerar(Comprobante $comprobante, InstitucionEducativa $instit): Comprobante
    {
        $items = $comprobante->load('items')->items->map(fn($item) => [
            'cod_producto' => $item->cod_producto,
            'unidad'       => $item->unidad,
            'descripcion'  => $item->descripcion,
            'cantidad'     => $item->cantidad,
            'precio'       => (float) $item->precio_unitario,
        ])->values()->toArray();

        $fechaEmision = $comprobante->fecha_emision->toDateString();

        $payload = [
            'endpoint'          => $comprobante->endpoint,
            'documento'         => $comprobante->tipo_documento,
            'empresa'           => [
                'ruc'           => (int) $instit->insti_ruc,
                'usuario'       => $instit->insti_sunat_usuario,
                'clave'         => $instit->insti_sunat_clave,
                'razon_social'  => $instit->insti_razon_social,
                'direccion'     => $instit->insti_direccion ?? 'SIN DIRECCION',
                'ubigeo'        => '150101',
                'distrito'      => 'LIMA',
                'provincia'     => 'LIMA',
                'departamento'  => 'LIMA',
            ],
            'cliente'           => [
                'num_doc'       => (int) $comprobante->cliente_num_doc,
                'rzn_social'    => $comprobante->cliente_nombre,
                'direccion'     => $comprobante->cliente_direccion ?? '',
            ],
            'serie'             => $comprobante->serie,
            'numero'            => (string) $comprobante->numero,
            'fecha_emision'     => $fechaEmision,
            'fecha_vencimiento' => $fechaEmision,
            'moneda'            => $comprobante->moneda,
            'forma_pago'        => $comprobante->forma_pago,
            'total'             => (float) $comprobante->total,
            'detalles'          => $items,
        ];

        try {
            $response = Http::timeout(30)->post("{$this->apiUrl}/generar/comprobante/electronico", $payload);
            $body     = $response->json();

            if ($response->successful() && ($body['estado'] ?? false)) {
                $apiData = $body['data'] ?? [];
                $comprobante = $this->repo->update($comprobante, [
                    'nombre_archivo' => $apiData['nombre_archivo'] ?? null,
                    'hash'           => $apiData['hash'] ?? null,
                    'qr_info'        => $apiData['qr_info'] ?? null,
                    'contenido_xml'  => $apiData['contenido_xml'] ?? null,
                    'estado'         => 'generado',
                ]);
            } else {
                $mensaje = $body['mensaje'] ?? $response->body();
                Log::warning("ComprobanteService@emitir API error: {$mensaje}");
                $comprobante = $this->repo->update($comprobante, [
                    'estado'         => 'borrador',
                    'sunat_response' => $mensaje,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('ComprobanteService@emitir HTTP: ' . $e->getMessage());
            $comprobante = $this->repo->update($comprobante, [
                'estado'         => 'borrador',
                'sunat_response' => $e->getMessage(),
            ]);
        }

        return $comprobante;
    }

    private function codProducto(Pago $pago): string
    {
        $base = $pago->concepto?->nombre ?? 'SERV';
        $base = strtoupper(substr(preg_replace('/[^A-Z0-9]/i', '', $base), 0, 10));

        if ($pago->pag_mes) {
            return $base . '-' . strtoupper(substr($pago->pag_mes, 0, 3));
        }

        return $base . '-' . $pago->pag_anual;
    }

    private function descripcionItem(Pago $pago): string
    {
        $concepto = strtoupper($pago->concepto?->nombre ?? 'SERVICIO EDUCATIVO');

        if ($pago->pag_mes) {
            return "{$concepto} - {$pago->pag_mes} {$pago->pag_anual}";
        }

        return "{$concepto} - {$pago->pag_anual}";
    }
}
