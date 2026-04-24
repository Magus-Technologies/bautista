<?php

namespace App\Repositories\Implements;

use App\Models\RhContrato;
use App\Repositories\Interfaces\RhContratoRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RhContratoRepository implements RhContratoRepositoryInterface
{
    public function paginate(int $instiId, string $search = '', string $estado = '', int $perPage = 15): LengthAwarePaginator
    {
        return RhContrato::with(['user.perfil', 'user.horarioAsistencia', 'institucion'])
            ->where('insti_id', $instiId)
            ->when($search, function ($query, $search) {
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('user.perfil', function ($q) use ($search) {
                    $q->where('primer_nombre', 'like', "%{$search}%")
                      ->orWhere('apellido_paterno', 'like', "%{$search}%")
                      ->orWhere('apellido_materno', 'like', "%{$search}%");
                });
            })
            ->when($estado, fn($query, $estado) => $query->where('estado', $estado))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function findById(int $id): RhContrato
    {
        return RhContrato::with(['user.perfil', 'user.horarioAsistencia', 'institucion'])->findOrFail($id);
    }

    public function findByUserId(int $userId): ?RhContrato
    {
        return RhContrato::where('user_id', $userId)
            ->where('estado', 'activo')
            ->first();
    }

    public function create(array $data): RhContrato
    {
        return RhContrato::create($data);
    }

    public function update(RhContrato $contrato, array $data): RhContrato
    {
        $contrato->update($data);
        return $contrato->fresh();
    }

    public function delete(RhContrato $contrato): void
    {
        $contrato->delete();
    }

    public function getContratosActivos(int $instiId): \Illuminate\Support\Collection
    {
        return RhContrato::with(['user.perfil', 'user.horarioAsistencia'])
            ->where('insti_id', $instiId)
            ->where('estado', 'activo')
            ->get();
    }
}
