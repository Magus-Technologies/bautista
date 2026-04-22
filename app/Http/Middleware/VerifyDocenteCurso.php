<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Docente;
use App\Models\DocenteCurso;
use App\Models\AsistenciaActividad;
use App\Models\Clase;

class VerifyDocenteCurso
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if ($user->hasAnyRole(['admin', 'super-admin', 'administrador', 'director'])) {
            return $next($request);
        }

        $docente = Docente::where('id_usuario', $user->id)->first();

        if (!$docente) {
            return response()->json(['message' => 'El usuario no tiene un perfil de docente asociado.'], 403);
        }

        // Intentamos obtener el ID del curso de diferentes formas comunes en las rutas
        $id = $request->route('id') 
            ?? $request->route('docenteCursoId') 
            ?? $request->input('docente_curso_id')
            ?? $request->input('docen_curso_id');

        // Si tenemos un ID, verificar según el contexto de la ruta
        if ($id) {
            $hasAccess = false;
            $routeName = $request->route()->getName();
            $uri = $request->route()->uri();

            // 1. Si es una ruta de Contenido (Unidades/Clases)
            if (str_contains($uri, 'contenido/clases')) {
                $cursoIdFromClase = \App\Models\Clase::where('clase_id', $id)
                    ->join('unidades', 'clases.unidad_id', '=', 'unidades.unidad_id')
                    ->value('unidades.curso_id');
                if ($cursoIdFromClase) {
                    $hasAccess = DocenteCurso::where('docente_id', $docente->docente_id)
                        ->where('curso_id', $cursoIdFromClase)
                        ->exists();
                }
            } else if (str_contains($uri, 'contenido/unidades')) {
                $cursoIdFromUnidad = \App\Models\Unidad::where('unidad_id', $id)->value('curso_id');
                if ($cursoIdFromUnidad) {
                    $hasAccess = DocenteCurso::where('docente_id', $docente->docente_id)
                        ->where('curso_id', $cursoIdFromUnidad)
                        ->exists();
                }
            } 
            // 2. Si es un ID de asignación (DocenteCurso) directo
            else {
                $hasAccess = DocenteCurso::where('docente_id', $docente->docente_id)
                    ->where('docen_curso_id', $id)
                    ->exists();

                // 3. Si no, puede ser un actividadId
                if (!$hasAccess) {
                    $cursoIdFromActividad = \App\Models\ActividadCurso::where('actividad_id', $id)->value('id_curso');
                    if ($cursoIdFromActividad) {
                        $hasAccess = DocenteCurso::where('docente_id', $docente->docente_id)
                            ->where('curso_id', $cursoIdFromActividad)
                            ->exists();
                    }
                }
            }

            // 4. Si no, puede ser un sessionId de asistencia_clases
            if (!$hasAccess && str_contains($uri, 'asistencia')) {
                $claseId = \App\Models\AsistenciaActividad::where('id', $id)->value('id_clase_curso');
                if ($claseId) {
                    $cursoIdFromClase = \App\Models\Clase::where('clase_id', $claseId)
                        ->join('unidades', 'clases.unidad_id', '=', 'unidades.unidad_id')
                        ->value('unidades.curso_id');
                    if ($cursoIdFromClase) {
                        $hasAccess = DocenteCurso::where('docente_id', $docente->docente_id)
                            ->where('curso_id', $cursoIdFromClase)
                            ->exists();
                    }
                }
            }

            if (!$hasAccess) {
                return response()->json(['message' => 'No tienes permiso para acceder a este curso o recurso.'], 403);
            }
        }

        // Si la ruta pide curso_id directamente (por ejemplo en contenido)
        $cursoId = $request->route('cursoId') ?? $request->input('curso_id');
        if ($cursoId) {
            $hasAccess = DocenteCurso::where('docente_id', $docente->docente_id)
                ->where('curso_id', $cursoId)
                ->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'No estás asignado a este curso.'], 403);
            }
        }

        return $next($request);
    }
}
