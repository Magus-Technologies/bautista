<?php

namespace App\Repositories\Interfaces;

use App\Models\Comprobante;
use App\Models\ComprobanteSerie;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface ComprobanteRepositoryInterface
{
    public function paginate(int $instiId, array $filters = [], int $perPage = 20): LengthAwarePaginator;

    public function findById(int $id): Comprobante;

    public function create(array $data): Comprobante;

    public function update(Comprobante $comprobante, array $data): Comprobante;

    public function porContacto(int $contactoId): Collection;

    /** Obtiene o crea la serie activa para el tipo dado. */
    public function obtenerSerie(int $instiId, string $tipoDocumento): ComprobanteSerie;

    /** Reserva el siguiente número correlativo de forma atómica. */
    public function siguienteNumero(ComprobanteSerie $serie): int;
}
