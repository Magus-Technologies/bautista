<?php

namespace App\Repositories\Implements;

use App\Models\RhAsistenciaPersonal;
use App\Repositories\Interfaces\RhAsistenciaPersonalRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RhAsistenciaPersonalRepository implements RhAsistenciaPersonalRepositoryInterface
{
    public function paginate(int $instiId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return RhAsistenciaPersonal::with(['user.perfil', 'contrato', 'horario'])
            ->where('insti_id', $instiId)
            ->when($filters['user_id'] ?? null, fn($q, $userId) => $q->where('user_id', $userId))
            ->when($filters['fecha_desde'] ?? null, fn($q, $fecha) => $q->where('fecha', '>=', $fecha))
            ->when($filters['fecha_hasta'] ?? null, fn($q, $fecha) => $q->where('fecha', '<=', $fecha))
            ->when($filters['estado'] ?? null, fn($q, $estado) => $q->where('estado', $estado))
            ->orderBy('fecha', 'desc')
            ->orderBy('hora_entrada', 'desc')
            ->paginate($perPage);
    }

    public function findById(int $id): RhAsistenciaPersonal
    {
        return RhAsistenciaPersonal::with(['user.perfil', 'contrato', 'horario'])->findOrFail($id);
    }

    public function findByUserAndDate(int $userId, string $fecha): ?RhAsistenciaPersonal
    {
        return RhAsistenciaPersonal::with(['horario', 'contrato'])
            ->where('user_id', $userId)
            ->where('fecha', $fecha)
            ->first();
    }

    public function create(array $data): RhAsistenciaPersonal
    {
        $model = RhAsistenciaPersonal::create($data);
        $model->load(['user.perfil', 'contrato', 'horario']);
        return $model;
    }

    public function update(RhAsistenciaPersonal $asistencia, array $data): RhAsistenciaPersonal
    {
        $asistencia->update($data);
        $asistencia->load(['user.perfil', 'contrato', 'horario']);
        return $asistencia;
    }

    public function delete(RhAsistenciaPersonal $asistencia): void
    {
        $asistencia->delete();
    }

    public function getAsistenciasByPeriodo(int $userId, int $mes, int $anio): \Illuminate\Support\Collection
    {
        return RhAsistenciaPersonal::where('user_id', $userId)
            ->whereYear('fecha', $anio)
            ->whereMonth('fecha', $mes)
            ->orderBy('fecha')
            ->get();
    }

    public function getTardanzasByPeriodo(int $userId, int $mes, int $anio): \Illuminate\Support\Collection
    {
        return RhAsistenciaPersonal::where('user_id', $userId)
            ->where('estado', 'tardanza')
            ->whereYear('fecha', $anio)
            ->whereMonth('fecha', $mes)
            ->orderBy('fecha')
            ->get();
    }
}
