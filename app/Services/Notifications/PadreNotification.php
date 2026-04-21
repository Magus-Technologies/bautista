<?php

namespace App\Services\Notifications;

use App\Models\ActividadCurso;
use App\Models\Anuncio;
use App\Models\AsistenciaAlumno;
use App\Models\DocenteCurso;
use App\Models\Matricula;
use App\Models\NotaActividad;
use App\Models\Pago;
use App\Models\PadreApoderado;
use App\Models\User;
use App\Services\Notifications\Shared\MensajesNotification;
use Illuminate\Support\Carbon;

class PadreNotification
{
    public function __construct(private MensajesNotification $mensajes) {}

    public function build(User $user): array
    {
        $padre = PadreApoderado::where('user_id', $user->id)->first();
        if (!$padre) return [];

        $hijos = $padre->estudiantes()->with('perfil:perfil_id,user_id,primer_nombre')->get();
        if ($hijos->isEmpty()) return $this->mensajes->sinLeer($user);

        $hijosIds      = $hijos->pluck('estu_id')->toArray();
        $notifications = $this->mensajes->sinLeer($user);
        $now           = Carbon::now();
        $en3d          = $now->copy()->addDays(3);
        $todayStr      = $now->toDateString();

        // Batch fetches
        $matriculas          = $this->fetchMatriculas($hijosIds);
        $seccionAperturaPairs = $this->extractPairs($matriculas);
        $allDocenteCursos    = $this->fetchDocenteCursos($seccionAperturaPairs);
        $docenteCursosByPair = $allDocenteCursos->groupBy(fn($dc) => "{$dc->seccion_id}_{$dc->apertura_id}");

        $allEntregadas  = $this->fetchEntregadas($hijosIds);
        $allActividades = $this->fetchActividades($allDocenteCursos, $now);
        $faltasHoy      = $this->fetchFaltasHoy($hijosIds, $todayStr);
        $notasNuevas    = $this->fetchNotasNuevas($hijosIds, $todayStr);
        $anunciosHoy    = $this->fetchAnunciosHoy($allDocenteCursos, $todayStr);

        foreach ($hijos as $hijo) {
            $estuId   = $hijo->estu_id;
            $nombre   = $hijo->perfil?->primer_nombre ?? 'Tu hijo';
            $matricula = $matriculas->get($estuId)?->first();
            if (!$matricula) continue;

            $pairKey           = "{$matricula->seccion_id}_{$matricula->apertura_id}";
            $hijoDocenteCursos = $docenteCursosByPair->get($pairKey, collect());
            $hijoCursoIds      = $hijoDocenteCursos->pluck('curso_id');
            $hijoDcIds         = $hijoDocenteCursos->pluck('docen_curso_id');
            $entregadasIds     = $allEntregadas->get($estuId, collect())->pluck('actividad_id')->toArray();

            $notifications = array_merge(
                $notifications,
                $this->actividadesNotifications($hijoCursoIds, $allActividades, $entregadasIds, $estuId, $nombre, $now, $en3d),
                $this->faltasNotifications($faltasHoy, $estuId, $nombre),
                $this->notasNotifications($notasNuevas, $estuId, $nombre),
                $this->anunciosNotifications($anunciosHoy, $hijoDcIds, $estuId, $nombre)
            );
        }

        // Pagos pendientes del padre
        $pagosPendientes = Pago::whereHas('contacto', fn($q) => $q->where('user_id', $user->id))
            ->where('estatus', 0)
            ->count();

        if ($pagosPendientes > 0) {
            $notifications[] = [
                'id'      => 'pagos_pendientes',
                'type'    => 'warning',
                'title'   => 'Pagos pendientes',
                'message' => "Tienes {$pagosPendientes} pago" . ($pagosPendientes > 1 ? 's' : '') . " pendiente" . ($pagosPendientes > 1 ? 's' : '') . ".",
                'link'    => '/padre/pagos',
            ];
        }

        return $notifications;
    }

    // ── Batch fetchers ────────────────────────────────────────────────────────

    private function fetchMatriculas(array $hijosIds)
    {
        return Matricula::select('matricula_id', 'estu_id', 'seccion_id', 'apertura_id')
            ->whereIn('estu_id', $hijosIds)
            ->where('estado', '1')
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('estu_id');
    }

    private function extractPairs($matriculas): array
    {
        $pairs = [];
        foreach ($matriculas as $mats) {
            $m = $mats->first();
            $pairs[] = ['seccion_id' => $m->seccion_id, 'apertura_id' => $m->apertura_id];
        }
        return $pairs;
    }

    private function fetchDocenteCursos(array $pairs)
    {
        if (empty($pairs)) return collect();

        $query = DocenteCurso::select('docen_curso_id', 'seccion_id', 'apertura_id', 'curso_id');
        foreach ($pairs as $pair) {
            $query->orWhere(function ($q) use ($pair) {
                $q->where('seccion_id', $pair['seccion_id'])
                  ->where(fn($sub) => $sub->where('apertura_id', $pair['apertura_id'])->orWhereNull('apertura_id'));
            });
        }
        return $query->with('curso:id_curso,nombre')->get();
    }

    private function fetchEntregadas(array $hijosIds)
    {
        return NotaActividad::select('id', 'estu_id', 'actividad_id')
            ->whereIn('estu_id', $hijosIds)
            ->where(fn($q) => $q->whereNotNull('archivo_entrega')->orWhereNotNull('nota'))
            ->get()
            ->groupBy('estu_id');
    }

    private function fetchActividades($allDocenteCursos, Carbon $now)
    {
        $cursoIds = $allDocenteCursos->pluck('curso_id')->unique();
        return ActividadCurso::select('actividad_id', 'id_curso', 'nombre_actividad', 'fecha_cierre', 'fecha_inicio')
            ->whereIn('id_curso', $cursoIds)
            ->where('es_calificado', '1')
            ->where('fecha_cierre', '>=', $now)
            ->with('clase:clase_id,unidad_id', 'clase.unidad:unidad_id,curso_id', 'clase.unidad.curso:id_curso,nombre')
            ->get()
            ->groupBy('id_curso');
    }

    private function fetchFaltasHoy(array $hijosIds, string $todayStr)
    {
        return AsistenciaAlumno::select('id', 'id_estudiante', 'estado')
            ->whereIn('id_estudiante', $hijosIds)
            ->where('estado', 'F')
            ->whereDate('created_at', $todayStr)
            ->get()
            ->groupBy('id_estudiante');
    }

    private function fetchNotasNuevas(array $hijosIds, string $todayStr)
    {
        return NotaActividad::select('id', 'estu_id', 'actividad_id', 'nota')
            ->whereIn('estu_id', $hijosIds)
            ->whereNotNull('nota')
            ->whereDate('fecha_calificacion', $todayStr)
            ->with('actividad:actividad_id,clase_id', 'actividad.clase:clase_id,unidad_id', 'actividad.clase.unidad:unidad_id,curso_id', 'actividad.clase.unidad.curso:id_curso,nombre')
            ->get()
            ->groupBy('estu_id');
    }

    private function fetchAnunciosHoy($allDocenteCursos, string $todayStr)
    {
        $dcIds = $allDocenteCursos->pluck('docen_curso_id')->unique();
        return Anuncio::select('id', 'docente_curso_id', 'titulo')
            ->whereIn('docente_curso_id', $dcIds)
            ->whereDate('created_at', $todayStr)
            ->with('docenteCurso:docen_curso_id,curso_id', 'docenteCurso.curso:id_curso,nombre')
            ->get()
            ->groupBy('docente_curso_id');
    }

    // ── Notification builders ─────────────────────────────────────────────────

    private function actividadesNotifications($hijoCursoIds, $allActividades, array $entregadasIds, int $estuId, string $nombre, Carbon $now, Carbon $en3d): array
    {
        $items = [];
        foreach ($hijoCursoIds as $cursoId) {
            foreach ($allActividades->get($cursoId, collect()) as $act) {
                if (in_array($act->actividad_id, $entregadasIds)) continue;

                $cierre      = Carbon::parse($act->fecha_cierre);
                $cursoNombre = $act->clase?->unidad?->curso?->nombre ?? 'un curso';
                $inicio      = Carbon::parse($act->fecha_inicio);
                $esNueva     = $inicio->greaterThanOrEqualTo($now->copy()->subHours(24));

                if ($cierre->isToday()) {
                    $items[] = ['id' => "hijo_vence_hoy_{$estuId}_{$act->actividad_id}", 'type' => 'error',
                        'title'   => "⚠️ {$nombre} — vence hoy",
                        'message' => "Recuerda que {$nombre} tiene {$act->nombre_actividad} sin resolver que termina hoy.",
                        'link'    => "/padre/hijo/{$estuId}"];
                } elseif ($cierre->between($now, $en3d)) {
                    $dias    = max(0, $now->diffInDays($cierre, false));
                    $items[] = ['id' => "hijo_vence_pronto_{$estuId}_{$act->actividad_id}", 'type' => 'warning',
                        'title'   => "{$nombre} — vence en {$dias} día" . ($dias != 1 ? 's' : ''),
                        'message' => "{$nombre} tiene {$act->nombre_actividad} en {$cursoNombre} que vence el {$cierre->format('d/m')}.",
                        'link'    => "/padre/hijo/{$estuId}"];
                } elseif ($esNueva) {
                    $items[] = ['id' => "hijo_nueva_act_{$estuId}_{$act->actividad_id}", 'type' => 'info',
                        'title'   => "{$nombre} — nueva tarea",
                        'message' => "{$nombre} tiene nueva tarea en {$cursoNombre}: {$act->nombre_actividad}. Inicia {$inicio->format('d/m')} — vence {$cierre->format('d/m')}.",
                        'link'    => "/padre/hijo/{$estuId}"];
                }
            }
        }
        return $items;
    }

    private function faltasNotifications($faltasHoy, int $estuId, string $nombre): array
    {
        $numFaltas = $faltasHoy->get($estuId, collect())->count();
        if ($numFaltas === 0) return [];

        return [[
            'id'      => "falta_hoy_{$estuId}",
            'type'    => 'warning',
            'title'   => "{$nombre} — falta registrada",
            'message' => "{$nombre} tiene {$numFaltas} falta" . ($numFaltas > 1 ? 's' : '') . " registrada" . ($numFaltas > 1 ? 's' : '') . " hoy.",
            'link'    => '/padre/asistencia',
        ]];
    }

    private function notasNotifications($notasNuevas, int $estuId, string $nombre): array
    {
        return $notasNuevas->get($estuId, collect())->map(function ($nota) use ($estuId, $nombre) {
            $cursoNombre = $nota->actividad?->clase?->unidad?->curso?->nombre ?? 'un curso';
            return [
                'id'      => "hijo_nota_{$estuId}_{$nota->id}",
                'type'    => 'success',
                'title'   => "{$nombre} — nueva calificación",
                'message' => "{$nombre} tiene nota en {$cursoNombre}: {$nota->nota}.",
                'link'    => "/padre/hijo/{$estuId}",
            ];
        })->toArray();
    }

    private function anunciosNotifications($anunciosHoy, $hijoDcIds, int $estuId, string $nombre): array
    {
        $items = [];
        foreach ($hijoDcIds as $dcId) {
            foreach ($anunciosHoy->get($dcId, collect()) as $anuncio) {
                $cursoNombre = $anuncio->docenteCurso?->curso?->nombre ?? 'un curso';
                $items[] = [
                    'id'      => "hijo_anuncio_{$estuId}_{$anuncio->id}",
                    'type'    => 'info',
                    'title'   => "{$nombre} — nuevo anuncio",
                    'message' => "Anuncio en {$cursoNombre} de {$nombre}: {$anuncio->titulo}.",
                    'link'    => "/padre/hijo/{$estuId}",
                ];
            }
        }
        return $items;
    }
}
