<?php

namespace App\Services\Interfaces;

use App\Models\Pago;
use App\Models\PagoNotifica;
use App\Models\PadreApoderado;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface PagoServiceInterface
{
    public function listarEstudiantesConPagador(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator;

    public function listarPagadores(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator;

    public function pagosPorContacto(int $contactoId): Collection;

    public function crearPago(array $data): Pago;

    public function actualizarPago(int $id, array $data): Pago;

    public function eliminarPago(int $id): void;
    
    /**
     * Vouchers / Notificaciones de Pago
     */
    public function subirVoucher(int $pagoId, int $userId, \Illuminate\Http\UploadedFile $archivo): PagoNotifica;

    public function listarVouchers(int $pagoId): Collection;

    public function validarVoucher(int $notificaId, string $estado, ?string $comentario): PagoNotifica;

    public function dashboard(int $instiId, string $mes, int $anio): array;

    public function vencidos(int $instiId): Collection;

    public function generarMensualidades(int $instiId, string $mes, int $anio): array;

    public function historialAlumno(int $instiId, int $estuId): array;

    public function reporteConsolidado(int $instiId, string $mes, int $anio): array;
}