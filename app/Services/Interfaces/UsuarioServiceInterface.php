<?php

namespace App\Services\Interfaces;

use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface UsuarioServiceInterface
{
    public function listar(int $instiId, string $search = '', bool $esTrabajador = false, int $perPage = 20): LengthAwarePaginator;
    public function obtener(int $id): User;
    public function crear(array $data): User;
    public function actualizar(int $id, array $data): User;
}
