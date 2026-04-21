<?php

namespace App\Http\Controllers;

use App\Models\Docente;
use App\Models\DocenteCurso;
use App\Models\Matricula;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocenteController extends Controller
{
    /**
     * Show all students across all sections the teacher is assigned to.
     */
    public function misAlumnos(Request $request): Response
    {
        $docente = Docente::where('id_usuario', $request->user()->id)->firstOrFail();

        $seccionIds = DocenteCurso::where('docente_id', $docente->docente_id)
            ->pluck('seccion_id')
            ->unique();

        $alumnos = Matricula::whereIn('seccion_id', $seccionIds)
            ->where('estado', '1')
            ->with([
                'estudiante' => fn($q) => $q->select('estu_id', 'perfil_id', 'foto'),
                'estudiante.perfil' => fn($q) => $q->select('perfil_id', 'doc_numero', 'primer_nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno', 'fecha_nacimiento', 'telefono', 'direccion'),
                'seccion' => fn($q) => $q->select('seccion_id', 'grado_id', 'nombre'),
                'seccion.grado' => fn($q) => $q->select('grado_id', 'nivel_id', 'nombre_grado'),
                'seccion.grado.nivel' => fn($q) => $q->select('nivel_id', 'nombre_nivel')
            ])
            ->get()
            ->unique('estu_id')
            ->map(fn ($m) => [
                'estu_id'          => $m->estudiante?->estu_id,
                'foto'             => $m->estudiante?->foto,
                'doc_numero'       => $m->estudiante?->perfil?->doc_numero,
                'primer_nombre'    => $m->estudiante?->perfil?->primer_nombre,
                'segundo_nombre'   => $m->estudiante?->perfil?->segundo_nombre,
                'apellido_paterno' => $m->estudiante?->perfil?->apellido_paterno,
                'apellido_materno' => $m->estudiante?->perfil?->apellido_materno,
                'fecha_nacimiento' => $m->estudiante?->perfil?->fecha_nacimiento,
                'telefono'         => $m->estudiante?->perfil?->telefono,
                'direccion'        => $m->estudiante?->perfil?->direccion,
                'grado'            => $m->seccion?->grado?->nombre_grado,
                'nivel'            => $m->seccion?->grado?->nivel?->nombre_nivel,
                'seccion'          => $m->seccion?->nombre,
            ])
            ->values();

        return Inertia::render('PortalDocente/MisAlumnos', [
            'alumnos' => $alumnos,
        ]);
    }
}
