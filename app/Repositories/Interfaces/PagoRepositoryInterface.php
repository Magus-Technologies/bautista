<?php

namespace App\Repositories\Interfaces;

use App\Models\Pago;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface PagoRepositoryInterface
{
    public function paginateEstudiantesConPagador(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator;

    public function pagosPorContacto(int $contactoId, ?int $conceptoId = null): Collection;

    public function findById(int $id): Pago;

    public function create(array $data): Pago;

    public function update(Pago $pago, array $data): Pago;

    public function delete(Pago $pago): void;

    public function dashboard(int $instiId, string $mes, int $anio): array;

    public function vencidos(int $instiId, int $diasGracia = 30): Collection;

    public function historialAlumno(int $instiId, int $estuId): array;

    public function reporteConsolidado(int $instiId, string $mes, int $anio): array;

    // Métodos de acceso a datos para la lógica de negocio en el Service
    public function getEstudiantesParaGeneracion(int $instiId, int $anio): Collection;
    public function getMontoTarifa(int $instiId, ?int $gradoId, int $anio, string $periodicidad, ?int $nivelId = null): ?float;
    public function getDescuentosEstudiante(int $estuId, string $fecha, ?int $conceptoId, ?int $nivelId = null, ?int $gradoId = null): Collection;

    /**
     * Verifica si ya existe un pago mensual para el alumno en ese período.
     * Si se pasa concepto_id, la unicidad es por alumno + concepto + mes + año.
     */
    public function existePago(int $estuId, string $mes, int $anio, ?int $conceptoId = null): bool;

    /**
     * Verifica si ya existe un pago de concepto único/anual para el alumno en ese año.
     */
    public function existePagoConcepto(int $estuId, int $anio, int $conceptoId): bool;
}