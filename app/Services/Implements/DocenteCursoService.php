<?php

namespace App\Services\Implements;

use App\Exceptions\DocenteCursoNotFoundException;
use App\Exceptions\DocenteNotFoundException;
use App\Models\Docente;
use App\Models\DocenteCurso;
use App\Models\Matricula;
use App\Models\NotaActividad;
use App\Models\Unidad;
use App\Services\Interfaces\DocenteCursoServiceInterface;

class DocenteCursoService implements DocenteCursoServiceInterface
{
    public function obtenerDashboard(int $usuarioId): array
    {
        $docente = Docente::where('id_usuario', $usuarioId)->first();
        
        if (!$docente) {
            throw new DocenteNotFoundException();
        }

        $misCursos = DocenteCurso::where('docente_id', $docente->docente_id)
            ->with(['curso', 'seccion.grado'])
            ->get();

        $seccionesIds = $misCursos->pluck('seccion_id')->unique();
        
        $totalEstudiantes = Matricula::whereIn('seccion_id', $seccionesIds)
            ->where('estado', '1')
            ->count();

        $pendientesCalificar = NotaActividad::whereIn('actividad_id', function($query) use ($misCursos) {
                $query->select('actividad_id')
                    ->from('actividad_curso')
                    ->whereIn('id_curso', $misCursos->pluck('curso_id'));
            })
            ->whereNotNull('archivo_entrega')
            ->where(function($q) {
                $q->whereNull('nota')->orWhere('nota', '');
            })
            ->count();

        return [
            'resumen' => [
                'cursos' => $misCursos->count(),
                'estudiantes' => $totalEstudiantes,
                'pendientes_calificar' => $pendientesCalificar,
            ],
            'cursos' => $misCursos,
        ];
    }

    public function obtenerCursosDocente(int $usuarioId): array
    {
        $docente = Docente::where('id_usuario', $usuarioId)->first();
        
        if (!$docente) {
            throw new DocenteNotFoundException();
        }

        return DocenteCurso::where('docente_id', $docente->docente_id)
            ->with(['curso', 'seccion.grado.nivel', 'apertura', 'docente.perfil'])
            ->get()
            ->all();
    }

    public function obtenerContenidoCurso(int $docenteCursoId): array
    {
        $dc = DocenteCurso::find($docenteCursoId);
        
        if (!$dc) {
            throw new DocenteCursoNotFoundException();
        }

        return Unidad::where('curso_id', $dc->curso_id)
            ->with([
                'clases' => function ($q) {
                    $q->orderBy('orden')
                      ->with(['archivos', 'actividades.tipoActividad']);
                }
            ])
            ->orderBy('orden')
            ->get()
            ->all();
    }

    public function actualizarConfiguracion(int $docenteCursoId, array $settings): array
    {
        $dc = DocenteCurso::find($docenteCursoId);
        
        if (!$dc) {
            throw new DocenteCursoNotFoundException();
        }

        $dc->update(['settings' => $settings]);

        return [
            'message' => 'Configuración actualizada correctamente.',
            'settings' => $dc->fresh()->settings
        ];
    }

    public function subirBanner(int $docenteCursoId, $file): array
    {
        $dc = DocenteCurso::find($docenteCursoId);
        
        if (!$dc) {
            throw new DocenteCursoNotFoundException();
        }

        // Delete old banner if exists
        if ($dc->banner && \Storage::disk('public')->exists($dc->banner)) {
            \Storage::disk('public')->delete($dc->banner);
        }

        // Store new banner
        $path = $file->store('banners/cursos', 'public');
        
        $dc->update(['banner' => $path]);

        return [
            'message' => 'Banner subido correctamente.',
            'banner' => $path,
            'url' => \Storage::disk('public')->url($path)
        ];
    }
}
