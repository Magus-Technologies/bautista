<?php

namespace App\Services\Implements;

use App\Models\User;
use App\Repositories\Interfaces\UsuarioRepositoryInterface;
use App\Services\Interfaces\UsuarioServiceInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class UsuarioService implements UsuarioServiceInterface
{
    public function __construct(
        private readonly UsuarioRepositoryInterface $repository,
    ) {}

    public function listar(int $instiId, string $search = '', bool $esTrabajador = false, int $perPage = 20): LengthAwarePaginator
    {
        return $this->repository->paginate($instiId, $search, $esTrabajador, $perPage);
    }

    public function obtener(int $id): User
    {
        return $this->repository->findById($id);
    }

    public function crear(array $data): User
    {
        return $this->repository->create($data);
    }

    public function actualizar(int $id, array $data): User
    {
        $user = $this->repository->findById($id);
        return $this->repository->update($user, $data);
    }
}
