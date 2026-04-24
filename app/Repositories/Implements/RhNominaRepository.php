<?php

namespace App\Repositories\Implements;

use App\Models\RhNomina;
use App\Repositories\Interfaces\RhNominaRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RhNominaRepository implements RhNominaRepositoryInterface
{
    public function paginate(int $instiId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return RhNomina::with(['user.perfil', 'contrato'])
            ->where('insti_id', $instiId)
            ->when($filters['user_id'] ?? null, fn($q, $userId) => $q->where('user_id', $userId))
            ->when($filters['mes'] ?? null, fn($q, $mes) => $q->where('mes', $mes))
            ->when($filters['anio'] ?? null, fn($q, $anio) => $q->where('anio', $anio))
            ->when($filters['estado'] ?? null, fn($q, $estado) => $q->where('estado', $estado))
            ->orderBy('anio', 'desc')
            ->orderBy('mes', 'desc')
            ->paginate($perPage);
    }

    public function findById(int $id): RhNomina
    {
        return RhNomina::with(['user.perfil', 'contrato'])->findOrFail($id);
    }

    public function findByUserAndPeriod(int $userId, int $mes, int $anio): ?RhNomina
    {
        return RhNomina::where('user_id', $userId)
            ->where('mes', $mes)
            ->where('anio', $anio)
            ->first();
    }

    public function create(array $data): RhNomina
    {
        return RhNomina::create($data);
    }

    public function update(RhNomina $nomina, array $data): RhNomina
    {
        $nomina->update($data);
        return $nomina->fresh();
    }

    public function delete(RhNomina $nomina): void
    {
        $nomina->delete();
    }
}
