<?php

namespace App\Services\Implements;

use App\Exceptions\HorarioNoDisponibleException;
use App\Models\HorarioAsistencia;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class HorarioResolverService
{
    private const VENTANA_MINUTOS = 120; // ±2 horas

    /**
     * Resuelve el horario activo para un trabajador en el momento actual.
     *
     * Jerarquía de búsqueda:
     *   1. Horarios con rol_id específico del usuario
     *   2. Horarios genéricos (rol_id IS NULL) como fallback
     *
     * De los encontrados, filtra los que tengan hora_ingreso dentro de ±2h de ahora
     * y elige el más cercano. Maneja el cruce de medianoche para turno noche.
     */
    public function resolverParaTrabajador(int $userId, int $instiId): HorarioAsistencia
    {
        $user   = User::findOrFail($userId);
        $rolId  = $user->rol_id;
        $ahora  = Carbon::now();

        $horarios = HorarioAsistencia::where('insti_id', $instiId)
            ->where('tipo_usuario', 'T')
            ->where(function ($q) use ($rolId) {
                $q->where('rol_id', $rolId)->orWhereNull('rol_id');
            })
            ->get();

        if ($horarios->isEmpty()) {
            throw new HorarioNoDisponibleException($ahora->format('H:i'), $rolId);
        }

        $candidato = $this->filtrarPorProximidad($horarios, $ahora, $rolId);

        if (!$candidato) {
            throw new HorarioNoDisponibleException($ahora->format('H:i'), $rolId);
        }

        return $candidato;
    }

    private function filtrarPorProximidad(Collection $horarios, Carbon $ahora, ?int $rolId): ?HorarioAsistencia
    {
        return $horarios
            ->map(function (HorarioAsistencia $h) use ($ahora, $rolId) {
                $horaIngreso = Carbon::parse($h->hora_ingreso)->setDateFrom($ahora);
                $diff        = $this->diffMinutosCircular($ahora, $horaIngreso);

                return [
                    'horario'   => $h,
                    'diff'      => $diff,
                    'especifico' => !is_null($h->rol_id) && $h->rol_id === $rolId,
                ];
            })
            ->filter(fn($item) => $item['diff'] <= self::VENTANA_MINUTOS)
            ->sortBy([
                // Priorizar horarios con rol específico sobre genéricos
                fn($a, $b) => $b['especifico'] <=> $a['especifico'],
                // Luego por el más cercano en tiempo
                fn($a, $b) => $a['diff'] <=> $b['diff'],
            ])
            ->first()['horario'] ?? null;
    }

    /**
     * Diferencia en minutos entre dos momentos considerando el círculo de 24h.
     * Necesario para que el turno noche (22:00) funcione cuando now() es 00:30.
     */
    private function diffMinutosCircular(Carbon $ahora, Carbon $referencia): int
    {
        $diff = abs($ahora->diffInMinutes($referencia));

        // Si la diferencia supera 12h, probablemente cruzó medianoche — tomar el complemento
        return (int) ($diff > 720 ? 1440 - $diff : $diff);
    }
}
