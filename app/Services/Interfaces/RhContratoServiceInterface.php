<?php

namespace App\Services\Interfaces;

use App\Models\RhContrato;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface RhContratoServiceInterface
{
    public function paginate(int $instiId, string $search = '', string $estado = '', int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): RhContrato;
    public function create(array $data): RhContrato;
    public function update(int $id, array $data): RhContrato;
    public function delete(int $id): void;
    public function finalizarContrato(int $id, string $fechaFin): RhContrato;
    public function suspenderContrato(int $id): RhContrato;
    public function reactivarContrato(int $id): RhContrato;
    public function getContratosActivos(int $instiId): \Illuminate\Support\Collection;
}
