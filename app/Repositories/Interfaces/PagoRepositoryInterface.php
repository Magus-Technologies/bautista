<?php

namespace App\Repositories\Interfaces;

use App\Models\Pago;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface PagoRepositoryInterface
{
    public function paginateEstudiantesConPagador(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator;

    public function pagosPorContacto(int $contactoId): Collection;

    public function findById(int $id): Pago;

    public function create(array $data): Pago;

    public function update(Pago $pago, array $data): Pago;

    public function delete(Pago $pago): void;

    public function dashboard(int $instiId, string $mes, int $anio): array;

    public function vencidos(int $instiId): Collection;

    public function historialAlumno(int $instiId, int $estuId): array;

    public function reporteConsolidado(int $instiId, string $mes, int $anio): array;

    // Métodos de acceso a datos para la lógica de negocio en el Service
    public function getEstudiantesParaGeneracion(int $instiId, int $anio): Collection;
    public function getMontoTarifa(int $instiId, ?int $gradoId, int $anio, string $periodicidad, ?int $nivelId = null): ?float;
    public function getDescuentosEstudiante(int $estuId, string $fecha, ?int $conceptoId, ?int $nivelId = null, ?int $gradoId = null): Collection;
    public function existePago(int $estuId, string $mes, int $anio): bool;
}