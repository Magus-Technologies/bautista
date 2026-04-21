<?php

namespace App\Services\Dashboard;

use App\Models\PadreApoderado;
use App\Models\Pago;
use App\Models\AsistenciaAlumno;
use App\Models\User;
use App\Services\Notifications\NotificationService;
use Illuminate\Support\Facades\Cache;

class PadreDashboardService
{
    public function __construct(private NotificationService $notifService) {}
    public function getStats(User $user): array
    {
        $padre = PadreApoderado::where('user_id', $user->id)->first();

        if (!$padre) {
            return ['hijos' => [], 'resumen' => [], 'notificaciones' => [], 'mensajes_pendientes' => []];
        }

        $padreId = $padre->id;

        $hijosData = Cache::store('database')->remember("padre_hijos_{$padreId}", 180, function () use ($padre) {
            $hijos = $padre->estudiantes()->with('perfil')->get();
            $estuIds = $hijos->pluck('estu_id');

            $asistenciaPorHijo = AsistenciaAlumno::whereIn('id_estudiante', $estuIds)
                ->get()
                ->groupBy('id_estudiante')
                ->map(function ($registros) {
                    $total = $registros->count();
                    $presentes = $registros->where('estado', 'P')->count();
                    return $total > 0 ? round(($presentes / $total) * 100) : 0;
                });

            return $hijos->map(fn($h) => [
                'estu_id'    => $h->estu_id,
                'nombre'     => $h->perfil?->nombre_ordenado ?? $h->perfil?->primer_nombre,
                'foto'       => $h->foto ? '/storage/' . $h->foto : null,
                'asistencia' => $asistenciaPorHijo[$h->estu_id] ?? 0,
                'perfil'     => $h->perfil,
            ])->values()->toArray();
        });

        $pagosRecientes = Cache::store('database')->remember("padre_pagos_{$padreId}", 120, function () use ($padre) {
            $estuIds = $padre->estudiantes()->pluck('estu_id');
            return Pago::whereIn('estu_id', $estuIds)
                ->orderBy('pag_fecha', 'desc')
                ->limit(5)
                ->get();
        });

        return [
            'hijos'               => $hijosData,
            'total_hijos'         => count($hijosData),
            'pagos_recientes'     => $pagosRecientes,
            'notificaciones'      => $this->notifService->forPadre($user),
            'mensajes_pendientes' => [],
        ];
    }
}
