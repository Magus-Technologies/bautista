<?php

namespace App\Repositories\Interfaces;

use App\Models\RhNomina;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface RhNominaRepositoryInterface
{
    public function paginate(int $instiId, array $filters = [], int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): RhNomina;
    public function findByUserAndPeriod(int $userId, int $mes, int $anio): ?RhNomina;
    public function create(array $data): RhNomina;
    public function update(RhNomina $nomina, array $data): RhNomina;
    public function delete(RhNomina $nomina): void;
}
