<?php

namespace App\Services\Notifications;

use App\Models\ActividadCurso;
use App\Models\Anuncio;
use App\Models\Docente;
use App\Models\DocenteCurso;
use App\Models\NotaActividad;
use App\Models\User;
use App\Services\Notifications\Shared\MensajesNotification;
use Illuminate\Support\Carbon;

class DocenteNotification
{
    public function __construct(private MensajesNotification $mensajes) {}

    public function build(User $user): array
    {
        $docente = Docente::select('docente_id')
            ->where('id_usuario', $user->id)
            ->first();
        if (!$docente) return [];

        $notifications = $this->mensajes->sinLeer($user);
        $now           = Carbon::now();

        $docenteCursos = DocenteCurso::select('docen_curso_id', 'docente_id', 'curso_id')
            ->where('docente_id', $docente->docente_id)
            ->with('curso:curso_id,nombre')
            ->get();

        $cursoIds = $docenteCursos->pluck('curso_id');

        // Eager load conteos de entregas sin calificar — evita N+1
        $actividadesVencidas = ActividadCurso::select('actividad_id', 'id_curso', 'nombre_actividad')
            ->whereIn('id_curso', $cursoIds)
            ->where('es_calificado', '1')
            ->where('fecha_cierre', '<', $now)
            ->withCount([
                'notasActividad as sin_calificar' => fn($q) => $q
                    ->whereNull('nota')
                    ->whereNotNull('archivo_entrega'),
            ])
            ->with('clase:clase_id,unidad_id', 'clase.unidad:unidad_id,curso_id', 'clase.unidad.curso:curso_id,nombre')
            ->get();

        foreach ($actividadesVencidas as $act) {
            if ($act->sin_calificar > 0) {
                $curso = $act->clase?->unidad?->curso?->nombre ?? 'un curso';
                $s     = $act->sin_calificar > 1;
                $notifications[] = [
                    'id'      => 'sin_calificar_' . $act->actividad_id,
                    'type'    => 'warning',
                    'title'   => 'Entregas por calificar',
                    'message' => "{$act->sin_calificar} entrega" . ($s ? 's' : '') . " pendiente" . ($s ? 's' : '') . " en {$act->nombre_actividad} ({$curso}).",
                    'link'    => '/docente/mis-cursos',
                ];
            }
        }

        // Anuncios publicados hoy
        $dcIds       = $docenteCursos->pluck('docen_curso_id');
        $anunciosHoy = Anuncio::select('id', 'docente_curso_id', 'titulo')
            ->whereIn('docente_curso_id', $dcIds)
            ->whereDate('created_at', $now->toDateString())
            ->with('docenteCurso:docen_curso_id,curso_id', 'docenteCurso.curso:curso_id,nombre')
            ->get();

        foreach ($anunciosHoy as $anuncio) {
            $curso = $anuncio->docenteCurso?->curso?->nombre ?? 'un curso';
            $notifications[] = [
                'id'      => 'docente_anuncio_' . $anuncio->id,
                'type'    => 'success',
                'title'   => 'Anuncio publicado',
                'message' => "Tu anuncio {$anuncio->titulo} fue publicado en {$curso}.",
                'link'    => '/docente/mis-cursos',
            ];
        }

        return $notifications;
    }
}
