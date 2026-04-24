<?php

namespace App\Services\Implements;

use App\Models\RhContrato;
use App\Repositories\Interfaces\RhContratoRepositoryInterface;
use App\Services\Interfaces\RhContratoServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RhContratoService implements RhContratoServiceInterface
{
    public function __construct(
        private RhContratoRepositoryInterface $repository
    ) {}

    public function paginate(int $instiId, string $search = '', string $estado = '', int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginate($instiId, $search, $estado, $perPage);
    }

    public function findById(int $id): RhContrato
    {
        return $this->repository->findById($id);
    }

    public function create(array $data): RhContrato
    {
        // Validar que el usuario no tenga un contrato activo
        $contratoActivo = $this->repository->findByUserId($data['user_id']);
        if ($contratoActivo) {
            throw new \Exception('El usuario ya tiene un contrato activo');
        }

        return $this->repository->create($data);
    }

    public function update(int $id, array $data): RhContrato
    {
        $contrato = $this->repository->findById($id);
        return $this->repository->update($contrato, $data);
    }

    public function delete(int $id): void
    {
        $contrato = $this->repository->findById($id);
        $this->repository->delete($contrato);
    }

    public function finalizarContrato(int $id, string $fechaFin): RhContrato
    {
        $contrato = $this->repository->findById($id);
        return $this->repository->update($contrato, [
            'fecha_fin' => $fechaFin,
            'estado' => 'finalizado',
        ]);
    }

    public function suspenderContrato(int $id): RhContrato
    {
        $contrato = $this->repository->findById($id);
        return $this->repository->update($contrato, [
            'estado' => 'suspendido',
        ]);
    }

    public function reactivarContrato(int $id): RhContrato
    {
        $contrato = $this->repository->findById($id);
        return $this->repository->update($contrato, [
            'estado' => 'activo',
        ]);
    }

    public function getContratosActivos(int $instiId): \Illuminate\Support\Collection
    {
        return $this->repository->getContratosActivos($instiId);
    }
}
