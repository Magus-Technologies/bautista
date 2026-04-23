<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IniciarAsistenciaRequest;
use App\Http\Requests\MarcarAsistenciaBatchRequest;
use App\Http\Requests\StoreAnuncioRequest;
use App\Http\Requests\StoreDocenteRequest;
use App\Http\Requests\UpdateAnuncioRequest;
use App\Http\Requests\UpdateCursoSettingsRequest;
use App\Http\Requests\UpdateDocenteRequest;
use App\Http\Resources\AlumnoMetricasResource;
use App\Http\Resources\AnuncioResource;
use App\Http\Resources\DocenteCursoResource;
use App\Http\Resources\DocenteResource;
use App\Services\Interfaces\DocenteCursoServiceInterface;
use App\Services\Interfaces\DocenteServiceInterface;
use App\Services\Interfaces\AnuncioServiceInterface;
use App\Services\Interfaces\DocenteAlumnoServiceInterface;
use App\Services\Interfaces\DocenteAsistenciaServiceInterface;
use App\Services\Interfaces\DocenteExcelExportServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;

class DocenteApiController extends Controller
{
    public function __construct(
        private readonly DocenteServiceInterface $docenteService,
        private readonly DocenteCursoServiceInterface $docenteCursoService,
        private readonly AnuncioServiceInterface $anuncioService,
        private readonly DocenteAlumnoServiceInterface $alumnoService,
        private readonly DocenteAsistenciaServiceInterface $asistenciaService,
        private readonly DocenteExcelExportServiceInterface $exportService,
    ) {}

    /**
     * List all teachers.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        return DocenteResource::collection($this->docenteService->listar(
            instiId: $request->user()->insti_id,
            search:  $request->get('search') ?? '',
            perPage: (int) $request->get('per_page', 20),
        ));
    }

    /**
     * Show a specific teacher.
     */
    public function show(int $id): DocenteResource
    {
        return new DocenteResource($this->docenteService->obtener($id));
    }

    /**
     * Create a new teacher.
     */
    public function store(StoreDocenteRequest $request): JsonResponse
    {
        return (new DocenteResource($this->docenteService->crear(array_merge(
            $request->validated(),
            ['insti_id' => $request->user()->insti_id],
        ))))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Update a teacher.
     */
    public function update(UpdateDocenteRequest $request, int $id): DocenteResource
    {
        return new DocenteResource($this->docenteService->actualizar($id, $request->validated()));
    }

    /**
     * Delete a teacher.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->docenteService->eliminar($id);
        return response()->json(null, 204);
    }

    /**
     * Get dashboard data for the authenticated teacher.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $data = $this->docenteCursoService->obtenerDashboard($request->user()->id);
        return response()->json($data);
    }

    /**
     * Get all courses assigned to the authenticated teacher.
     */
    public function misCursos(Request $request): JsonResponse
    {
        $cursos = $this->docenteCursoService->obtenerCursosDocente($request->user()->id);
        return response()->json($cursos);
    }

    /**
     * Get course content (units/classes) for a specific assignment.
     */
    public function cursoContenido(int $id): JsonResponse
    {
        $contenido = $this->docenteCursoService->obtenerContenidoCurso($id);
        return response()->json($contenido);
    }

    /**
     * Get announcements for a course.
     */
    public function getAnuncios(int $id): AnonymousResourceCollection
    {
        $anuncios = $this->anuncioService->obtenerAnuncios($id);
        return AnuncioResource::collection($anuncios);
    }

    /**
     * Create an announcement.
     */
    public function storeAnuncio(Request $request): JsonResponse
    {
        $data = $request->validate([
            'docente_curso_id' => 'required|integer',
            'titulo' => 'required|string|max:255',
            'contenido' => 'required|string',
        ]);

        $anuncio = $this->anuncioService->crearAnuncio($data);
        return response()->json($anuncio, 201);
    }

    /**
     * Update an announcement.
     */
    public function updateAnuncio(int $id, Request $request): JsonResponse
    {
        $data = $request->validate([
            'titulo' => 'string|max:255',
            'contenido' => 'string',
        ]);

        $anuncio = $this->anuncioService->actualizarAnuncio($id, $data);
        return response()->json($anuncio);
    }

    /**
     * Delete an announcement.
     */
    public function destroyAnuncio(int $id): JsonResponse
    {
        $this->anuncioService->eliminarAnuncio($id);
        return response()->json(null, 204);
    }

    /**
     * Get all students for the authenticated teacher across all sections.
     */
    public function misAlumnos(): JsonResponse
    {
        $alumnos = $this->alumnoService->obtenerTodosAlumnos(Auth::id());
        return response()->json($alumnos);
    }

    /**
     * Get students for a specific section.
     */
    public function alumnosSeccion(Request $request, int $docenteCursoId): JsonResponse
    {
        $alumnos = $this->alumnoService->obtenerAlumnosSeccion($docenteCursoId);
        return response()->json($alumnos);
    }

    /**
     * Get students with detailed metrics for the Alumnos tab.
     */
    public function alumnosDetallados(int $docenteCursoId): AnonymousResourceCollection
    {
        $alumnos = $this->alumnoService->obtenerAlumnosConMetricas($docenteCursoId);
        return AlumnoMetricasResource::collection($alumnos);
    }

    /**
     * Get editable attendance matrix (alumnos × fechas del mes).
     */
    public function asistenciaEditable(Request $request, int $docenteCursoId): JsonResponse
    {
        $mes = $request->input('mes', date('Y-m'));
        $data = $this->asistenciaService->obtenerMatrizEditable($docenteCursoId, $mes);
        return response()->json($data);
    }

    /**
     * Save attendance for all students on a specific date.
     */
    public function guardarAsistenciaFecha(Request $request, int $docenteCursoId): JsonResponse
    {
        $request->validate([
            'fecha'                       => 'required|date_format:Y-m-d',
            'asistencias'                 => 'required|array|min:1',
            'asistencias.*.id_estudiante' => 'required|integer|exists:estudiantes,estu_id',
            'asistencias.*.estado'        => 'required|in:P,F,T,J',
            'asistencias.*.observacion'   => 'nullable|string|max:300',
        ]);

        $this->asistenciaService->guardarAsistenciaPorFecha(
            $docenteCursoId,
            $request->input('fecha'),
            $request->input('asistencias')
        );

        return response()->json(['message' => 'Asistencia guardada.']);
    }

    /**
     * Get attendance matrix for a course.
     */
    public function asistenciaMatrix(Request $request, int $docenteCursoId): JsonResponse
    {
        $desde = $request->input('desde');
        $hasta = $request->input('hasta');
        
        $matriz = $this->asistenciaService->obtenerMatrizAsistencia($docenteCursoId, $desde, $hasta);
        return response()->json($matriz);
    }

    /**
     * Export attendance to Excel.
     */
    public function exportarAsistencia(Request $request, int $docenteCursoId)
    {
        $desde = $request->input('desde');
        $hasta = $request->input('hasta');
        
        $matrixData = $this->asistenciaService->obtenerMatrizAsistencia($docenteCursoId, $desde, $hasta);
        $tempFile = $this->exportService->exportarAsistencia($docenteCursoId, $matrixData);
        
        $fileName = 'asistencia_' . date('Y-m-d') . '.xlsx';
        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }

    /**
     * Export students list to Excel.
     */
    public function exportarAlumnos(int $docenteCursoId)
    {
        $alumnosData = $this->alumnoService->obtenerAlumnosConMetricas($docenteCursoId);
        $tempFile = $this->exportService->exportarAlumnos($docenteCursoId, $alumnosData);
        
        $fileName = 'alumnos_' . date('Y-m-d') . '.xlsx';
        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }

    /**
     * Update course settings.
     */
    public function updateSettings(UpdateCursoSettingsRequest $request, int $id): JsonResponse
    {
        $result = $this->docenteCursoService->actualizarConfiguracion($id, $request->validated()['settings']);
        return response()->json($result);
    }

    /**
     * Upload course banner.
     */
    public function uploadBanner(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'banner' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:5120',
        ]);

        $result = $this->docenteCursoService->subirBanner($id, $request->file('banner'));
        return response()->json($result);
    }

    /**
     * Start an attendance session.
     */
    public function iniciarAsistencia(IniciarAsistenciaRequest $request): JsonResponse
    {
        $session = $this->asistenciaService->iniciarSesionAsistencia($request->validated());
        return response()->json($session);
    }

    /**
     * Mark attendance for students.
     */
    public function marcarAsistencia(MarcarAsistenciaBatchRequest $request, int $sessionId): JsonResponse
    {
        $this->asistenciaService->marcarAsistencia($sessionId, $request->validated()['asistencias']);
        return response()->json(['message' => 'Asistencia guardada con éxito.']);
    }

    /**
     * Get students with performance metrics (legacy method - kept for compatibility).
     */
    public function alumnosConMetricas(Request $request, int $docenteCursoId): JsonResponse
    {
        $alumnos = $this->docenteCursoService->obtenerAlumnosConMetricas($docenteCursoId);
        return response()->json($alumnos);
    }

    /**
     * Get personal attendance history for the authenticated docente.
     */
    public function miAsistencia(Request $request): JsonResponse
    {
        $docente = \App\Models\Docente::where('id_usuario', $request->user()->id)->first();

        if (!$docente) {
            return response()->json(['message' => 'No se encontró perfil de docente.'], 404);
        }

        $query = \App\Models\Asistencia::where('id_persona', $docente->docente_id)
            ->where('tipo', 'D')
            ->orderBy('fecha', 'desc');

        if ($mes = $request->query('mes')) {
            $query->whereMonth('fecha', $mes);
        }
        if ($anio = $request->query('anio')) {
            $query->whereYear('fecha', $anio);
        }

        return response()->json($query->limit(100)->get());
    }

    /**
     * Generate fotocheck PDF for a single docente.
     */
    public function fotocheck(int $id)
    {
        // Use the existing FotocheckService which handles everything correctly
        $fotocheckService = app(\App\Services\Interfaces\FotocheckServiceInterface::class);
        return $fotocheckService->generateForId($id);
    }

    /**
     * Generate fotochecks PDF for all active docentes.
     */
    public function fotochecksMasivo(Request $request)
    {
        $docentes = \App\Models\Docente::with(['perfil', 'user'])
            ->where('id_insti', $request->user()->insti_id)
            ->where('estado', '1')
            ->get();

        if ($docentes->isEmpty()) {
            return response()->json(['message' => 'No hay docentes activos para generar fotochecks.'], 404);
        }

        $config = \App\Models\ConfiguracionFotocheck::where('is_active', true)->first() ?? new \App\Models\ConfiguracionFotocheck();

        // Process logo to base64
        $logoSrc = '';
        if ($config->logo_path) {
            $logoPath = storage_path('app/public/' . $config->logo_path);
            if (file_exists($logoPath)) {
                $mime = mime_content_type($logoPath);
                $logoSrc = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($logoPath));
            }
        }
        
        if (!$logoSrc) {
            $defaultLogoPath = public_path('images/logo.png');
            if (file_exists($defaultLogoPath)) {
                $mime = mime_content_type($defaultLogoPath);
                $logoSrc = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($defaultLogoPath));
            }
        }

        $fotochecksData = [];

        foreach ($docentes as $docente) {
            // Generate QR code
            $qrCode = new \Endroid\QrCode\QrCode(
                data: $docente->user->id . '',
                encoding: new \Endroid\QrCode\Encoding\Encoding('UTF-8'),
                errorCorrectionLevel: \Endroid\QrCode\ErrorCorrectionLevel::Low,
                size: 120,
                margin: 0,
                roundBlockSizeMode: \Endroid\QrCode\RoundBlockSizeMode::Margin
            );

            $writer = new \Endroid\QrCode\Writer\PngWriter();
            $qrSrc = $writer->write($qrCode)->getDataUri();

            // Process photo to base64
            $fotoPath = ($docente->perfil && $docente->perfil->foto_perfil) 
                        ? storage_path('app/public/' . $docente->perfil->foto_perfil) 
                        : null;
            
            $defaultPath = public_path('images/default-avatar.png');
            $imgPath = ($fotoPath && file_exists($fotoPath)) ? $fotoPath : $defaultPath;

            $fotoSrc = '';
            if (file_exists($imgPath)) {
                $mime = mime_content_type($imgPath);
                $fotoSrc = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($imgPath));
            }

            // Build full name
            $nombre = trim(
                ($docente->perfil->primer_nombre ?? '') . ' ' .
                ($docente->perfil->segundo_nombre ?? '') . ' ' .
                ($docente->perfil->apellido_paterno ?? '') . ' ' .
                ($docente->perfil->apellido_materno ?? '')
            );

            $fotochecksData[] = [
                'qrSrc' => $qrSrc,
                'fotoSrc' => $fotoSrc,
                'logoSrc' => $logoSrc,
                'tipo' => 'DOCENTE',
                'nombre' => $nombre,
                'idDisplay' => 'DOC-' . str_pad($docente->docente_id, 6, '0', STR_PAD_LEFT),
                'dni' => $docente->perfil->doc_numero ?? null,
                'especialidad' => $docente->especialidad ?? null,
                'telefono' => $docente->perfil->telefono ?? null,
                'config' => $config,
                'periodo' => date('Y'),
            ];
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reportes.fotocheck-docente-bulk', [
            'fotochecks' => $fotochecksData,
            'periodo' => date('Y'),
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('fotochecks_docentes_' . date('Y-m-d') . '.pdf');
    }
}
