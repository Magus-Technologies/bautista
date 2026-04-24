<?php

namespace App\Services\Interfaces;

use App\Models\RhAsistenciaPersonal;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface RhAsistenciaPersonalServiceInterface
{
    public function paginate(int $instiId, array $filters = [], int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): RhAsistenciaPersonal;
    public function registrarEntrada(int $userId, int $instiId, ?string $observaciones = null): RhAsistenciaPersonal;
    public function registrarSalida(int $userId): RhAsistenciaPersonal;
    public function registrarManual(array $data): RhAsistenciaPersonal;
    public function update(int $id, array $data): RhAsistenciaPersonal;
    public function delete(int $id): void;
    public function getReportePeriodo(int $userId, int $mes, int $anio): array;
}
