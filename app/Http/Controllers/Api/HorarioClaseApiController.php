<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\HorarioConflictoException;
use App\Exceptions\HorarioNotFoundException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHorarioClaseRequest;
use App\Http\Requests\UpdateHorarioClaseRequest;
use App\Http\Resources\HorarioClaseResource;
use App\Models\HorarioClase;
use App\Services\Interfaces\HorarioServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HorarioClaseApiController extends Controller
{
    public function __construct(
        private HorarioServiceInterface $horarioService
    ) {}

    /**
     * GET /api/secciones/{seccionId}/horario
     * Obtener horario completo de una sección
     */
    public function porSeccion(Request $request, int $seccionId): JsonResponse
    {
        $anio = $request->input('anio', date('Y'));
        $horario = $this->horarioService->obtenerHorarioSeccion($seccionId, $anio);
        
        return response()->json($horario);
    }

    /**
     * GET /api/docentes/{docenteId}/horario-clases
     * Obtener horario completo de un docente
     */
    public function porDocente(Request $request, int $docenteId): JsonResponse
    {
        $anio = $request->input('anio', date('Y'));
        $horario = $this->horarioService->obtenerHorarioDocente($docenteId, $anio);
        
        return response()->json($horario);
    }

    /**
     * GET /api/secciones/{seccionId}/horario-pdf
     * Descargar horario de sección en PDF
     */
    public function pdfSeccion(Request $request, int $seccionId): \Symfony\Component\HttpFoundation\Response
    {
        $anio    = $request->input('anio', date('Y'));
        $horario = $this->horarioService->obtenerHorarioSeccion($seccionId, $anio);

        $seccion = \App\Models\Seccion::with('grado')->findOrFail($seccionId);
        $titulo  = $seccion->nombre . ($seccion->grado ? ' — ' . $seccion->grado->nombre_grado : '');

        $html = view('pdf.horario-clases', [
            'horario'        => $horario,
            'titulo'         => $titulo,
            'anio'           => $anio,
            'fecha'          => now()->format('d/m/Y H:i'),
            'mostrarDocente' => true,
            'mostrarSeccion' => false,
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'landscape');

        return $pdf->download("Horario_{$seccion->nombre}_{$anio}.pdf");
    }

    /**
     * GET /api/docentes/{docenteId}/horario-pdf
     * Descargar horario de docente en PDF
     */
    public function pdfDocente(Request $request, int $docenteId): \Symfony\Component\HttpFoundation\Response
    {
        $anio    = $request->input('anio', date('Y'));
        $horario = $this->horarioService->obtenerHorarioDocente($docenteId, $anio);

        $docente = \App\Models\Docente::with('perfil')->findOrFail($docenteId);
        $nombre  = $docente->perfil
            ? trim($docente->perfil->primer_nombre . ' ' . $docente->perfil->apellido_paterno)
            : "Docente #{$docenteId}";

        $html = view('pdf.horario-clases', [
            'horario'        => $horario,
            'titulo'         => $nombre,
            'anio'           => $anio,
            'fecha'          => now()->format('d/m/Y H:i'),
            'mostrarDocente' => false,
            'mostrarSeccion' => true,
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'landscape');

        return $pdf->download("Horario_Docente_{$anio}.pdf");
    }

    /**
     * GET /api/alumno/horario-pdf
     * Descargar horario del alumno autenticado en PDF
     */
    public function pdfAlumno(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $anio = $request->input('anio', date('Y'));

        // Reutilizar el endpoint del alumno para obtener el horario
        $alumnoController = app(\App\Http\Controllers\Api\AlumnoApiController::class);
        $response = $alumnoController->horario($request);
        $data = $response->getData(true);
        $horario = $data['horario'] ?? [];

        $user   = $request->user();
        $nombre = $user->nombre_completo ?? $user->name ?? 'Alumno';

        $html = view('pdf.horario-clases', [
            'horario'        => $horario,
            'titulo'         => $nombre,
            'anio'           => $anio,
            'fecha'          => now()->format('d/m/Y H:i'),
            'mostrarDocente' => true,
            'mostrarSeccion' => false,
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'landscape');

        return $pdf->download("Mi_Horario_{$anio}.pdf");
    }

    /**
     * POST /api/horario-clases
     * Crear nueva clase en el horario
     */
    public function store(StoreHorarioClaseRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Detectar conflictos
        $conflictos = $this->horarioService->detectarConflictos($validated);
        
        if (!empty($conflictos)) {
            throw new HorarioConflictoException($conflictos);
        }

        $clase = HorarioClase::create($validated);
        $clase->load(['curso', 'docente', 'seccion']);

        return response()->json([
            'message' => 'Clase agregada al horario exitosamente',
            'clase' => new HorarioClaseResource($clase)
        ], 201);
    }

    /**
     * PUT /api/horario-clases/{id}
     * Actualizar clase del horario
     */
    public function update(UpdateHorarioClaseRequest $request, int $id): JsonResponse
    {
        $clase = HorarioClase::find($id);
        
        if (!$clase) {
            throw new HorarioNotFoundException("Clase con ID {$id} no encontrada");
        }

        $validated = $request->validated();

        // Si se modifican datos de tiempo/ubicación, detectar conflictos
        if (isset($validated['dia_semana']) || isset($validated['hora_inicio']) || isset($validated['hora_fin'])) {
            $datosConflicto = array_merge($clase->toArray(), $validated);
            $datosConflicto['horario_clase_id'] = $id;
            
            $conflictos = $this->horarioService->detectarConflictos($datosConflicto);
            
            if (!empty($conflictos)) {
                throw new HorarioConflictoException($conflictos);
            }
        }

        $clase->update($validated);
        $clase->load(['curso', 'docente', 'seccion']);

        return response()->json([
            'message' => 'Clase actualizada exitosamente',
            'clase' => new HorarioClaseResource($clase)
        ]);
    }

    /**
     * DELETE /api/horario-clases/{id}
     * Eliminar clase del horario
     */
    public function destroy(int $id): JsonResponse
    {
        $clase = HorarioClase::find($id);
        
        if (!$clase) {
            throw new HorarioNotFoundException("Clase con ID {$id} no encontrada");
        }
        
        $clase->delete();

        return response()->json([
            'message' => 'Clase eliminada del horario'
        ]);
    }

    /**
     * POST /api/horario-clases/validar-conflictos
     * Validar conflictos sin guardar
     */
    public function validarConflictos(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'seccion_id' => 'required|exists:secciones,seccion_id',
            'docente_id' => 'required|exists:docentes,docente_id',
            'dia_semana' => 'required|integer|min:1|max:7',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i',
            'aula' => 'nullable|string|max:50',
            'anio_escolar' => 'required|integer',
            'horario_clase_id' => 'nullable|integer',
        ]);

        $conflictos = $this->horarioService->detectarConflictos($validated);

        return response()->json([
            'tiene_conflictos' => !empty($conflictos),
            'conflictos' => $conflictos
        ]);
    }

    /**
     * GET /api/docentes/{docenteId}/carga-horaria
     * Obtener carga horaria de un docente
     */
    public function cargaHoraria(Request $request, int $docenteId): JsonResponse
    {
        $anio = $request->input('anio', date('Y'));
        $carga = $this->horarioService->calcularCargaHoraria($docenteId, $anio);

        return response()->json($carga);
    }

    /**
     * POST /api/secciones/{seccionId}/clonar-horario
     * Clonar horario de un año a otro
     */
    public function clonarHorario(Request $request, int $seccionId): JsonResponse
    {
        $validated = $request->validate([
            'anio_origen' => 'required|integer|min:2020',
            'anio_destino' => 'required|integer|min:2020|different:anio_origen',
        ]);

        $contador = $this->horarioService->clonarHorario(
            $seccionId,
            $validated['anio_origen'],
            $validated['anio_destino']
        );

        return response()->json([
            'message' => "Se clonaron {$contador} clases exitosamente",
            'clases_clonadas' => $contador
        ]);
    }
}
