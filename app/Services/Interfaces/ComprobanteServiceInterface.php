<?php

namespace App\Services\Interfaces;

use App\Models\Comprobante;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ComprobanteServiceInterface
{
    /**
     * Emite un comprobante electrónico (boleta o factura) llamando a la API Magus.
     * Crea el registro en BD y vincula los pagos indicados.
     *
     * @param  array{
     *   insti_id: int,
     *   tipo_documento: string,
     *   forma_pago: string,
     *   cliente_tipo_doc: string,
     *   cliente_num_doc: string,
     *   cliente_nombre: string,
     *   cliente_direccion: string|null,
     *   contacto_id: int|null,
     *   estu_id: int|null,
     *   pag_ids: int[],
     * } $data
     */
    public function emitir(array $data): Comprobante;

    /** Envía un comprobante ya generado a SUNAT y actualiza el estado. */
    public function enviarASunat(int $comprobanteId): Comprobante;

    /** Lista comprobantes paginados con filtros opcionales. */
    public function listar(int $instiId, array $filters = [], int $perPage = 20): LengthAwarePaginator;

    /** Comprobantes de un contacto/pagador. */
    public function porContacto(int $contactoId): Collection;

    /** Sube el certificado .pem a la API Magus para el RUC de la institución. */
    public function subirCertificado(int $instiId, UploadedFile $archivo): bool;
}
