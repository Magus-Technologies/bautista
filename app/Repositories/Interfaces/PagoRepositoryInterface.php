<?php

namespace App\Repositories\Interfaces;

use App\Models\Pago;
use App\Models\PadreApoderado;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface PagoRepositoryInterface
{
    public function paginateEstudiantesConPagador(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator;

    public function paginatePagadores(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator;

    public function pagosPorContacto(int $contactoId): Collection;

    public function findById(int $id): Pago;

    public function create(array $data): Pago;

    public function update(Pago $pago, array $data): Pago;

    public function delete(Pago $pago): void;

    public function dashboard(int $instiId, string $mes, int $anio): array;

    public function vencidos(int $instiId): Collection;

    public function crearMensualidades(int $instiId, string $mes, int $anio): array;

    public function historialAlumno(int $instiId, int $estuId): array;

    public function reporteConsolidado(int $instiId, string $mes, int $anio): array;
}