<?php

namespace App\Services\Dashboard;

use App\Models\Docente;
use App\Models\DocenteCurso;
use App\Models\Matricula;
use App\Models\NotaActividad;
use App\Models\User;
use App\Services\Notifications\NotificationService;
use Illuminate\Support\Facades\Cache;

class DocenteDashboardService
{
    public function __construct(private NotificationService $notifService) {}

    public function getStats(User $user): array
    {
        $docente = Docente::where('id_usuario', $user->id)->first();
        if (!$docente) return ['error' => 'No docente found'];

        $docenteId = $docente->docente_id;

        $resumen = Cache::store('database')->remember("docente_resumen_{$docenteId}", 180, function () use ($docenteId) {
            $cursosCount = DocenteCurso::where('docente_id', $docenteId)->count();

            $seccionIds = DocenteCurso::where('docente_id', $docenteId)
                ->whereNotNull('seccion_id')
                ->pluck('seccion_id')
                ->unique();

            $estudiantesCount = Matricula::whereIn('seccion_id', $seccionIds)
                ->where('estado', '1')
                ->distinct('estu_id')
                ->count('estu_id');

            $pendientesCalificar = NotaActividad::whereHas('actividad', function ($q) use ($docenteId) {
                $q->whereHas('clase.unidad.curso', function ($q2) use ($docenteId) {
                    $q2->whereHas('docenteCursos', fn($q3) => $q3->where('docente_id', $docenteId));
                });
            })->whereNull('nota')->whereNotNull('archivo_entrega')->count();

            return [
                'cursos'               => $cursosCount,
                'estudiantes'          => $estudiantesCount,
                'pendientes_calificar' => $pendientesCalificar,
            ];
        });

        $cursos = Cache::store('database')->remember("docente_cursos_{$docenteId}", 180, fn() =>
            DocenteCurso::where('docente_id', $docenteId)
                ->with(['curso', 'seccion.grado'])
                ->get()
        );

        return [
            'resumen'             => $resumen,
            'cursos'              => $cursos,
            'notificaciones'      => $this->notifService->forDocente($user),
            'mensajes_pendientes' => [],
        ];
    }
}
