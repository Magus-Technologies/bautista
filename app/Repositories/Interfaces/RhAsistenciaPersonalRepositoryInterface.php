<?php

namespace App\Repositories\Interfaces;

use App\Models\RhAsistenciaPersonal;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface RhAsistenciaPersonalRepositoryInterface
{
    public function paginate(int $instiId, array $filters = [], int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): RhAsistenciaPersonal;
    public function findByUserAndDate(int $userId, string $fecha): ?RhAsistenciaPersonal;
    public function create(array $data): RhAsistenciaPersonal;
    public function update(RhAsistenciaPersonal $asistencia, array $data): RhAsistenciaPersonal;
    public function delete(RhAsistenciaPersonal $asistencia): void;
    public function getAsistenciasByPeriodo(int $userId, int $mes, int $anio): \Illuminate\Support\Collection;
    public function getTardanzasByPeriodo(int $userId, int $mes, int $anio): \Illuminate\Support\Collection;
}
