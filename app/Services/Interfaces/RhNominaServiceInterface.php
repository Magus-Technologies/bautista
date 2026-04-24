<?php

namespace App\Services\Interfaces;

use App\Models\RhNomina;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface RhNominaServiceInterface
{
    public function paginate(int $instiId, array $filters = [], int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): RhNomina;
    public function generarNominaMensual(int $instiId, int $mes, int $anio): array;
    public function aprobarNomina(int $id): RhNomina;
    public function registrarPago(int $id, string $fechaPago, ?string $observaciones = null): RhNomina;
    public function eliminar(int $id): void;
}
