<?php

namespace App\Repositories\Implements;

use App\Models\Comprobante;
use App\Models\ComprobanteSerie;
use App\Repositories\Interfaces\ComprobanteRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ComprobanteRepository implements ComprobanteRepositoryInterface
{
    public function paginate(int $instiId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return Comprobante::with(['items', 'contacto'])
            ->where('insti_id', $instiId)
            ->when($filters['tipo'] ?? null, fn($q, $v) => $q->where('tipo_documento', $v))
            ->when($filters['estado'] ?? null, fn($q, $v) => $q->where('estado', $v))
            ->when($filters['contacto_id'] ?? null, fn($q, $v) => $q->where('contacto_id', $v))
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function findById(int $id): Comprobante
    {
        return Comprobante::with(['items', 'pagos.concepto', 'contacto', 'estudiante'])
            ->findOrFail($id);
    }

    public function create(array $data): Comprobante
    {
        return Comprobante::create($data);
    }

    public function update(Comprobante $comprobante, array $data): Comprobante
    {
        $comprobante->update($data);

        return $comprobante->fresh();
    }

    public function porContacto(int $contactoId): Collection
    {
        return Comprobante::with('items')
            ->where('contacto_id', $contactoId)
            ->orderByDesc('id')
            ->get();
    }

    public function obtenerSerie(int $instiId, string $tipoDocumento, ?string $tipoBase = null): ComprobanteSerie
    {
        // Determinar el prefijo de la serie (4 caracteres según SUNAT)
        $prefijo = match($tipoDocumento) {
            'factura' => 'F001',
            'boleta' => 'B001',
            'nota_credito' => $tipoBase === 'factura' ? 'FC01' : 'BC01',
            'nota_debito' => $tipoBase === 'factura' ? 'FD01' : 'BD01',
            default => 'B001',
        };

        return ComprobanteSerie::firstOrCreate(
            ['insti_id' => $instiId, 'tipo_documento' => $tipoDocumento],
            ['serie' => $prefijo, 'ultimo_numero' => 0, 'activo' => true]
        );
    }

    public function siguienteNumero(ComprobanteSerie $serie): int
    {
        return DB::transaction(function () use ($serie) {
            $serie = ComprobanteSerie::lockForUpdate()->find($serie->id);
            $serie->increment('ultimo_numero');

            return $serie->ultimo_numero;
        });
    }
}
