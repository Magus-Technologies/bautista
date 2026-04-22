<?php

namespace App\Services\Notifications;

use App\Models\ActividadCurso;
use App\Models\Anuncio;
use App\Models\DocenteCurso;
use App\Models\Estudiante;
use App\Models\Matricula;
use App\Models\NotaActividad;
use App\Models\User;
use App\Services\Notifications\Shared\MensajesNotification;
use Illuminate\Support\Carbon;

class EstudianteNotification
{
    public function __construct(private MensajesNotification $mensajes) {}

    public function build(User $user): array
    {
        $estudiante = Estudiante::select('estu_id')
            ->where('user_id', $user->id)
            ->first();
        if (!$estudiante) return [];

        $matricula = Matricula::select('matricula_id', 'estu_id', 'seccion_id', 'apertura_id')
            ->where('estu_id', $estudiante->estu_id)
            ->where('estado', '1')
            ->orderBy('created_at', 'desc')
            ->first();

        $notifications = $this->mensajes->sinLeer($user);
        if (!$matricula) return $notifications;

        $docenteCursos = DocenteCurso::select('docen_curso_id', 'seccion_id', 'apertura_id', 'curso_id')
            ->where('seccion_id', $matricula->seccion_id)
            ->where(fn($q) => $q->where('apertura_id', $matricula->apertura_id)->orWhereNull('apertura_id'))
            ->with('curso:curso_id,nombre')
            ->get();

        $cursoIds = $docenteCursos->pluck('curso_id');
        $now      = Carbon::now();
        $en3dias  = $now->copy()->addDays(3);

        $actividades = ActividadCurso::select('actividad_id', 'id_curso', 'nombre_actividad', 'fecha_cierre', 'fecha_inicio')
            ->whereIn('id_curso', $cursoIds)
            ->where('es_calificado', '1')
            ->where('fecha_cierre', '>=', $now)
            ->with('clase:clase_id,unidad_id', 'clase.unidad:unidad_id,curso_id', 'clase.unidad.curso:curso_id,nombre')
            ->get();

        // Solo los IDs — no necesitamos el modelo completo
        $entregadas = NotaActividad::where('estu_id', $estudiante->estu_id)
            ->where(fn($q) => $q->whereNotNull('archivo_entrega')->orWhereNotNull('nota'))
            ->pluck('actividad_id')
            ->toArray();

        foreach ($actividades as $act) {
            if (in_array($act->actividad_id, $entregadas)) continue;

            $cierre  = Carbon::parse($act->fecha_cierre);
            $curso   = $act->clase?->unidad?->curso?->nombre ?? 'un curso';
            $esNueva = Carbon::parse($act->fecha_inicio)->greaterThanOrEqualTo($now->copy()->subHours(24));

            if ($cierre->isToday()) {
                $notifications[] = [
                    'id'      => 'vence_hoy_' . $act->actividad_id,
                    'type'    => 'error',
                    'title'   => '⚠️ Vence hoy',
                    'message' => "Tu {$act->nombre_actividad} en {$curso} termina hoy.",
                    'link'    => '/alumno/cursos',
                ];
            } elseif ($cierre->between($now, $en3dias)) {
                $dias = $now->diffInDays($cierre);
                $notifications[] = [
                    'id'      => 'vence_pronto_' . $act->actividad_id,
                    'type'    => 'warning',
                    'title'   => "Vence en {$dias} día" . ($dias > 1 ? 's' : ''),
                    'message' => "{$act->nombre_actividad} en {$curso} vence el {$cierre->format('d/m')}.",
                    'link'    => '/alumno/cursos',
                ];
            } elseif ($esNueva) {
                $notifications[] = [
                    'id'      => 'nueva_act_' . $act->actividad_id,
                    'type'    => 'info',
                    'title'   => 'Nueva actividad',
                    'message' => "Nueva tarea en {$curso}: {$act->nombre_actividad}. Vence {$cierre->format('d/m')}.",
                    'link'    => '/alumno/cursos',
                ];
            }
        }

        // Notas nuevas de hoy
        $notasHoy = NotaActividad::select('id', 'estu_id', 'actividad_id', 'nota')
            ->where('estu_id', $estudiante->estu_id)
            ->whereNotNull('nota')
            ->whereDate('fecha_calificacion', $now->toDateString())
            ->with('actividad:actividad_id,clase_id', 'actividad.clase:clase_id,unidad_id', 'actividad.clase.unidad:unidad_id,curso_id', 'actividad.clase.unidad.curso:id_curso,nombre')
            ->get();

        foreach ($notasHoy as $nota) {
            $curso = $nota->actividad?->clase?->unidad?->curso?->nombre ?? 'un curso';
            $notifications[] = [
                'id'      => 'nota_nueva_' . $nota->id,
                'type'    => 'success',
                'title'   => 'Nueva calificación',
                'message' => "Tienes nota en {$curso}: {$nota->nota}.",
                'link'    => '/alumno/notas',
            ];
        }

        // Anuncios nuevos de hoy
        $dcIds    = $docenteCursos->pluck('docen_curso_id');
        $anuncios = Anuncio::select('id', 'docente_curso_id', 'titulo')
            ->whereIn('docente_curso_id', $dcIds)
            ->whereDate('created_at', $now->toDateString())
            ->with('docenteCurso:docen_curso_id,curso_id', 'docenteCurso.curso:id_curso,nombre')
            ->get();

        foreach ($anuncios as $anuncio) {
            $curso = $anuncio->docenteCurso?->curso?->nombre ?? 'un curso';
            $notifications[] = [
                'id'      => 'anuncio_' . $anuncio->id,
                'type'    => 'info',
                'title'   => 'Nuevo anuncio',
                'message' => "Anuncio en {$curso}: {$anuncio->titulo}.",
                'link'    => '/alumno/cursos',
            ];
        }

        return $notifications;
    }
}
