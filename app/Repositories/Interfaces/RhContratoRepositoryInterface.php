<?php

namespace App\Repositories\Interfaces;

use App\Models\RhContrato;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface RhContratoRepositoryInterface
{
    public function paginate(int $instiId, string $search = '', string $estado = '', int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): RhContrato;
    public function findByUserId(int $userId): ?RhContrato;
    public function create(array $data): RhContrato;
    public function update(RhContrato $contrato, array $data): RhContrato;
    public function delete(RhContrato $contrato): void;
    public function getContratosActivos(int $instiId): \Illuminate\Support\Collection;
}
