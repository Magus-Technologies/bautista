<?php

namespace App\Services\Dashboard;

use App\Models\AsistenciaAlumno;
use App\Models\DocenteCurso;
use App\Models\Estudiante;
use App\Models\Matricula;
use App\Models\NotaActividad;
use App\Models\User;
use App\Services\Notifications\NotificationService;
use Illuminate\Support\Facades\Cache;

class EstudianteDashboardService
{
    public function __construct(private NotificationService $notifService) {}

    public function getStats(User $user): array
    {
        $estudiante = Estudiante::where('user_id', $user->id)->first();

        if (!$estudiante) {
            return [
                'stats' => ['tareas_pendientes' => 0, 'asistencia_perc' => 0, 'promedio_general' => 0],
                'notificaciones' => [],
                'mensajes_pendientes' => [],
            ];
        }

        $estuId = $estudiante->estu_id;

        $stats = Cache::store('database')->remember("est_stats_{$estuId}", 180, fn() => [
            'tareas_pendientes' => $this->getTareasPendientes($estudiante),
            'asistencia_perc'   => $this->getAsistenciaPercentage($estudiante),
            'promedio_general'  => $this->getPromedioGeneral($estudiante),
        ]);

        $cursos = Cache::store('database')->remember("est_cursos_{$estuId}", 180, fn() => $this->getCursos($estudiante));

        return [
            'stats'               => $stats,
            'cursos'              => $cursos,
            'notificaciones'      => $this->notifService->forEstudiante($user),
            'mensajes_pendientes' => [],
        ];
    }

    private function getAsistenciaPercentage(Estudiante $estudiante): float
    {
        $total = AsistenciaAlumno::where('id_estudiante', $estudiante->estu_id)->count();
        if ($total === 0) return 0;
        $presentes = AsistenciaAlumno::where('id_estudiante', $estudiante->estu_id)
            ->whereIn('estado', ['P', 'T', 'J'])->count();
        return round(($presentes / $total) * 100, 1);
    }

    private function getPromedioGeneral(Estudiante $estudiante): float
    {
        $notas = NotaActividad::where('estu_id', $estudiante->estu_id)
            ->whereNotNull('nota')
            ->where('nota', '!=', '')
            ->pluck('nota')
            ->filter(fn($n) => is_numeric($n))
            ->map(fn($n) => floatval($n));
        return $notas->count() > 0 ? round($notas->avg(), 1) : 0;
    }

    private function getCursos(Estudiante $estudiante): array
    {
        $matricula = Matricula::where('estu_id', $estudiante->estu_id)
            ->where('estado', '1')
            ->with(['apertura', 'seccion'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$matricula) return [];

        return DocenteCurso::where('seccion_id', $matricula->seccion_id)
            ->where(function ($q) use ($matricula) {
                $q->where('apertura_id', $matricula->apertura_id)
                  ->orWhereNull('apertura_id');
            })
            ->with(['curso', 'nivel'])
            ->get()
            ->map(fn($dc) => [
                'id'          => $dc->docen_curso_id,
                'apertura_id' => $dc->apertura_id ?? $matricula->apertura_id,
                'curso'       => ['nombre' => $dc->curso?->nombre ?? '—'],
                'apertura'    => [
                    'nombre' => $matricula->apertura?->nombre ?? '2026',
                    'nivel'  => ['nombre' => $dc->nivel?->nombre ?? '—'],
                    'sede'   => ['nombre' => 'General'],
                ],
            ])
            ->toArray();
    }

    private function getTareasPendientes(Estudiante $estudiante): int
    {
        $matricula = Matricula::where('estu_id', $estudiante->estu_id)->where('estado', '1')->first();
        if (!$matricula) return 0;

        $entregadas = NotaActividad::where('estu_id', $estudiante->estu_id)
            ->where(function ($q) {
                $q->whereNotNull('archivo_entrega')->orWhereNotNull('nota');
            })
            ->pluck('actividad_id');

        return \App\Models\ActividadCurso::whereHas('clase.unidad', function ($q) use ($matricula) {
            $q->whereHas('curso', function ($q2) use ($matricula) {
                $q2->whereHas('docenteCursos', fn($q3) => $q3
                    ->where('seccion_id', $matricula->seccion_id)
                    ->where(function ($q4) use ($matricula) {
                        $q4->where('apertura_id', $matricula->apertura_id)
                           ->orWhereNull('apertura_id');
                    }));
            });
        })
        ->where('es_calificado', '1')
        ->where('fecha_cierre', '>=', now())
        ->whereNotIn('actividad_id', $entregadas)
        ->count();
    }
}
