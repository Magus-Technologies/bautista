<?php

namespace App\Repositories\Interfaces;

use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface UsuarioRepositoryInterface
{
    public function paginate(int $instiId, string $search = '', bool $esTrabajador = false, int $perPage = 20): LengthAwarePaginator;
    public function findById(int $id): User;
    public function create(array $data): User;
    public function update(User $user, array $data): User;
}
