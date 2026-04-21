<?php

namespace App\Repositories\Interfaces;

use App\Models\PadreApoderado;
use Illuminate\Pagination\LengthAwarePaginator;

interface PadreRepositoryInterface
{
    public function paginatePagadores(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator;
    public function findById(int $id): PadreApoderado;
}
