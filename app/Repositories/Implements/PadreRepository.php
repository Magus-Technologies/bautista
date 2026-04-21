<?php

namespace App\Repositories\Implements;

use App\Models\PadreApoderado;
use App\Repositories\Interfaces\PadreRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class PadreRepository implements PadreRepositoryInterface
{
    public function paginatePagadores(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        return PadreApoderado::with(['estudiantes.perfil'])
            ->withCount('pagos')
            ->where('insti_id', $instiId)
            ->where('es_pagador', '1')
            ->when($search, fn ($q) => $q
                ->where('nombres', 'like', "%{$search}%")
                ->orWhere('apellidos', 'like', "%{$search}%")
                ->orWhere('numero_doc', 'like', "%{$search}%")
            )
            ->latest('id_contacto')
            ->paginate($perPage);
    }

    public function findById(int $id): PadreApoderado
    {
        return PadreApoderado::findOrFail($id);
    }
}
