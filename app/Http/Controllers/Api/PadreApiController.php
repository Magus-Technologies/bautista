<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estudiante;
use App\Models\PadreApoderado;
use App\Models\NotaActividad;
use App\Models\Pago;
use App\Models\Matricula;
use App\Models\DocenteCurso;
use Illuminate\Http\Request;

class PadreApiController extends Controller
{
    /**
     * Get weekly schedule for a specific child.
     */
    public function horarioHijo(Request $request, int $hijoId)
    {
        $userId = $request->user()->id;
        $padre  = PadreApoderado::where('user_id', $userId)->firstOrFail();
        $padre->estudiantes()->where('estudiantes.estu_id', $hijoId)->firstOrFail();

        $matricula = Matricula::where('estu_id', $hijoId)
            ->where('estado', '1')
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$matricula) {
            return response()->json(['horario' => [], 'seccion_id' => null, 'anio' => (int) date('Y')]);
        }

        $anio = $request->query('anio', date('Y'));

        $clases = \App\Models\HorarioClase::with(['curso', 'docente.perfil', 'aulaObj'])
            ->where('seccion_id', $matricula->seccion_id)
            ->where('anio_escolar', $anio)
            ->where('activo', true)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();

        $horario = [];
        foreach ($clases as $clase) {
            $dia = $clase->dia_semana;
            if (!isset($horario[$dia])) {
                $horario[$dia] = ['dia' => $clase->nombre_dia, 'clases' => []];
            }
            $horario[$dia]['clases'][] = [
                'id'          => $clase->horario_clase_id,
                'curso'       => $clase->curso->nombre,
                'curso_id'    => $clase->curso_id,
                'docente'     => trim(($clase->docente->perfil->primer_nombre ?? '') . ' ' . ($clase->docente->perfil->apellido_paterno ?? '')),
                'docente_id'  => $clase->docente_id,
                'hora_inicio' => $clase->hora_inicio_formateada,
                'hora_fin'    => $clase->hora_fin_formateada,
                'aula'        => $clase->aulaObj?->nombre ?? $clase->aula,
                'duracion'    => $clase->duracion_minutos,
            ];
        }

        return response()->json([
            'seccion_id' => $matricula->seccion_id,
            'anio'       => (int) $anio,
            'horario'    => $horario,
        ]);
    }

    /**
     * List children associated with the parent.
     */
    public function hijos(Request $request)
    {
        $userId = $request->user()->id;
        $padre = PadreApoderado::where('user_id', $userId)->first();

        if (!$padre) {
            return response()->json(['message' => 'No se encontró perfil de padre para este usuario.'], 404);
        }

        $hijos = $padre->estudiantes()->with('perfil')->get();

        return response()->json($hijos);
    }

    /**
     * Get entry/exit attendance for a specific child.
     */
    public function asistenciaHijo(Request $request, int $hijoId)
    {
        $userId = $request->user()->id;
        $padre  = PadreApoderado::where('user_id', $userId)->firstOrFail();
        $padre->estudiantes()->where('estudiantes.estu_id', $hijoId)->firstOrFail();

        $logs = \App\Models\Asistencia::where('id_persona', $hijoId)
            ->where('tipo', 'E')
            ->orderBy('fecha', 'desc')
            ->limit(100)
            ->get()
            ->map(fn($a) => [
                'asistencia_id' => $a->asistencia_id,
                'fecha'         => $a->fecha?->format('Y-m-d'),
                'estado'        => $a->estado,
                'turno'         => $a->turno,
                'hora_entrada'  => $a->hora_entrada,
                'hora_salida'   => $a->hora_salida,
            ]);

        return response()->json($logs);
    }

    /**
     * List teachers for a specific child.
     */
    public function profesoresHijo(Request $request, int $hijoId)
    {
        $userId = $request->user()->id;
        $padre  = PadreApoderado::where('user_id', $userId)->firstOrFail();

        // Security: verify the child belongs to this parent
        $hijo = $padre->estudiantes()->where('estudiantes.estu_id', $hijoId)->firstOrFail();

        $matricula = Matricula::where('estu_id', $hijoId)
            ->where('estado', '1')
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$matricula) return response()->json([]);

        $profesores = DocenteCurso::where('seccion_id', $matricula->seccion_id)
            ->where(function($query) use ($matricula) {
                $query->where('apertura_id', $matricula->apertura_id)
                      ->orWhereNull('apertura_id');
            })
            ->with(['docente.perfil', 'docente.user', 'curso'])
            ->get()
            ->map(function ($dc) {
                $perfil = $dc->docente?->perfil;
                return [
                    'docente_id' => $dc->docente_id,
                    'nombre'     => trim(($perfil->primer_nombre ?? '') . ' ' . ($perfil->segundo_nombre ?? '')),
                    'apellido'   => trim(($perfil->apellido_paterno ?? '') . ' ' . ($perfil->apellido_materno ?? '')),
                    'curso'      => $dc->curso?->nombre ?? '—',
                    'email'      => $dc->docente?->user?->email ?? null,
                    'telefono'   => $perfil?->telefono ?? null,
                    'foto'       => $perfil?->foto_perfil ? asset('storage/' . $perfil->foto_perfil) : null,
                ];
            });

        return response()->json($profesores);
    }
    public function hijoDetalle(Request $request, int $hijoId)
    {
        $userId = $request->user()->id;
        $padre = PadreApoderado::where('user_id', $userId)->first();
        
        // Security check — qualify the column to avoid ambiguity in the JOIN
        $hijo = $padre->estudiantes()->where('estudiantes.estu_id', $hijoId)->with('perfil')->firstOrFail();

        // Grades grouped by course
        $todasNotas = NotaActividad::where('estu_id', $hijoId)
            ->with(['actividad.clase.unidad.curso', 'actividad.tipoActividad'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Group by curso
        $notasPorCurso = $todasNotas
            ->filter(fn($n) => $n->actividad?->clase?->unidad?->curso)
            ->groupBy(fn($n) => $n->actividad->clase->unidad->curso->id)
            ->map(function($notas, $cursoId) {
                $curso = $notas->first()->actividad->clase->unidad->curso;
                $notasCalificadas = $notas->filter(fn($n) => is_numeric($n->nota));
                $promedio = $notasCalificadas->count() > 0
                    ? round($notasCalificadas->avg('nota'), 1)
                    : null;
                return [
                    'curso_id'  => $cursoId,
                    'curso'     => $curso->nombre,
                    'promedio'  => $promedio,
                    'notas'     => $notas->map(fn($n) => [
                        'actividad_id'     => $n->actividad_id,
                        'nombre_actividad' => $n->actividad->nombre_actividad,
                        'tipo'             => $n->actividad->tipoActividad?->nombre,
                        'nota'             => $n->nota,
                        'puntos_maximos'   => $n->actividad->puntos_maximos,
                        'observacion'      => $n->observacion,
                        'fecha'            => $n->created_at?->format('d/m/Y'),
                    ])->values(),
                ];
            })->values();

        // Payments — include last voucher status for each pago
        $pagos = Pago::where('estu_id', $hijoId)
            ->with([
                'notificas' => fn ($q) => $q->orderBy('created_at', 'desc'),
                'concepto'
            ])
            ->orderBy('pag_fecha', 'desc')
            ->get()
            ->map(function ($p) {
                $ultimo = $p->notificas->first();
                $arr = $p->toArray();
                unset($arr['notificas']);
                unset($arr['concepto']);
                $arr['pag_fecha'] = $p->pag_fecha ? \Carbon\Carbon::parse($p->pag_fecha)->format('Y-m-d') : null;
                $arr['concepto_nombre'] = $p->concepto?->nombre ?? null;
                $arr['ultimo_voucher'] = $ultimo ? [
                    'estado'      => $ultimo->estado,
                    'comentario'  => $ultimo->comentario,
                    'archivo_url' => $ultimo->archivo ? \Illuminate\Support\Facades\Storage::url($ultimo->archivo) : null,
                ] : null;

                return $arr;
            });

        // Attendance by course — from asistencia_alumnos/asistencia_clases
        $registros = \App\Models\AsistenciaAlumno::where('id_estudiante', $hijoId)
            ->with(['session.clase.unidad.curso'])
            ->get();

        $asistenciaPorCurso = $registros
            ->filter(fn($r) => $r->session?->clase?->unidad?->curso)
            ->groupBy(fn($r) => $r->session->clase->unidad->curso->id)
            ->map(function($items) {
                $curso = $items->first()->session->clase->unidad->curso;
                $total     = $items->count();
                $presentes = $items->where('estado', 'P')->count();
                $tardanzas = $items->where('estado', 'T')->count();
                $faltas    = $items->where('estado', 'F')->count();
                $pct       = $total > 0 ? round(($presentes / $total) * 100) : 0;
                return [
                    'curso_id'  => $curso->id,
                    'curso'     => $curso->nombre,
                    'total'     => $total,
                    'presentes' => $presentes,
                    'tardanzas' => $tardanzas,
                    'faltas'    => $faltas,
                    'porcentaje'=> $pct,
                    'historial' => $items->sortByDesc(fn($r) => $r->session->fecha)->map(fn($r) => [
                        'fecha'  => $r->session->fecha,
                        'estado' => $r->estado,
                        'observacion' => $r->observacion,
                    ])->values(),
                ];
            })->values();

        $totalPresentes = $registros->where('estado', 'P')->count();
        $totalSesiones  = $registros->count();
        $asistencia = [
            'porcentaje' => $totalSesiones > 0 ? round(($totalPresentes / $totalSesiones) * 100) : 0,
            'presentes'  => $totalPresentes,
            'tardanzas'  => $registros->where('estado', 'T')->count(),
            'faltas'     => $registros->where('estado', 'F')->count(),
            'por_curso'  => $asistenciaPorCurso,
        ];

        return response()->json([
            'hijo'     => $hijo,
            'notas'    => $notasPorCurso,
            'pagos'    => $pagos,
            'asistencia' => $asistencia,
        ]);
    }
}
