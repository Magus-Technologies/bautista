<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asistencia;
use App\Models\Estudiante;
use App\Models\Docente;
use App\Models\User;
use App\Services\Interfaces\AsistenciaServiceInterface;
use App\Repositories\Interfaces\AsistenciaRepositoryInterface;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AsistenciaGeneralApiController extends Controller
{
    public function __construct(
        private readonly AsistenciaServiceInterface $service,
        private readonly AsistenciaRepositoryInterface $repository
    ) {}

    /**
     * Get list of users (Students or Teachers) for attendance management.
     */
    public function index(Request $request)
    {
        $tipo = $request->query('tipo', 'E');
        $search = $request->query('search', '');
        
        $filters = $request->only(['nivel_id', 'grado_id', 'seccion_id', 'anio']);
        
        return response()->json($this->repository->getPaginatedUsers($tipo, $search, 20, $filters));
    }

    /**
     * Get detailed attendance history for a specific user.
     */
    public function show(Request $request, $id)
    {
        $tipo    = $request->query('tipo', 'E');
        $perPage = (int) $request->query('per_page', 15);
        $page    = (int) $request->query('page', 1);
        $instiId = auth()->user()->insti_id ?? 1;

        $fechaInicio = $request->query('fecha_inicio');
        $fechaFin    = $request->query('fecha_fin');

        $query = \App\Models\Asistencia::where('insti_id', $instiId)
            ->where('id_persona', (int)$id)
            ->where('tipo', $tipo)
            ->orderBy('fecha', 'desc');

        if ($fechaInicio && $fechaFin) {
            $query->whereBetween('fecha', [$fechaInicio, $fechaFin]);
        } else {
            $mes  = $request->query('mes', date('m'));
            $anio = $request->query('anio', date('Y'));
            $query->whereYear('fecha', $anio)->whereMonth('fecha', $mes);
        }

        return response()->json($query->paginate($perPage, ['*'], 'page', $page));
    }

    /**
     * Mark attendance via QR.
     */
    public function marcarQR(Request $request)
    {
        $validated = $request->validate([
            'qr_data' => 'required|string',
            'tipo_marcado' => 'required|in:entrada,salida',
        ]);

        try {
            $result = $this->service->marcarPorQR($validated['qr_data'], $validated['tipo_marcado']);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    /**
     * Get recent logs for general display.
     */
    public function historial(Request $request)
    {
        return response()->json($this->service->getHistorialConNombres());
    }

    /**
     * Export attendance history to Excel.
     */
    public function export(Request $request, $id)
    {
        $tipo = $request->query('tipo', 'E');
        $data = $this->service->exportarExcelPersona((int)$id, $tipo, $request->all());

        $logs = $data['logs'];
        $nombre = $data['nombre'];
        $periodoLabel = $data['label'];

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->mergeCells('A1:D1');
        $sheet->setCellValue('A1', "Historial de Asistencia - {$nombre} - {$periodoLabel}");
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(12);

        $sheet->setCellValue('A2', 'Fecha')->setCellValue('B2', 'Turno')->setCellValue('C2', 'Entrada')->setCellValue('D2', 'Salida');
        $sheet->getStyle('A2:D2')->getFont()->setBold(true);

        $fila = 3;
        foreach ($logs as $log) {
            $sheet->setCellValue('A' . $fila, $log->fecha->format('d/m/Y'));
            $sheet->setCellValue('B' . $fila, $log->turno === 'M' ? 'Mañana' : 'Tarde');
            $sheet->setCellValue('C' . $fila, $log->hora_entrada ? substr($log->hora_entrada, 0, 5) : '—');
            $sheet->setCellValue('D' . $fila, $log->hora_salida ? substr($log->hora_salida, 0, 5) : '—');
            $fila++;
        }

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $filename = "Asistencia_{$nombre}_" . date('Ymd_His') . ".xlsx";
        $tempFile = tempnam(sys_get_temp_dir(), 'excel');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
    }

    /**
     * Get user info and parent contacts for WhatsApp modal.
     */
    public function showUserInfo(Request $request, $id)
    {
        $tipo = $request->query('tipo', 'E');
        
        $data = [
            'nombre' => '',
            'contactos' => []
        ];

        if ($tipo === 'E') {
            $estu = Estudiante::with(['perfil', 'contactos'])->find($id);
            if ($estu) {
                $data['nombre'] = $estu->nombre_completo;
                foreach ($estu->contactos as $c) {
                    if ($c->telefono_1) {
                        $data['contactos'][] = [
                            'label'    => $c->parentesco ?? 'Contacto',
                            'nombre'   => "{$c->nombres} {$c->apellidos}",
                            'telefono' => $c->telefono_1
                        ];
                    }
                }
            }
        } else {
            $doc = Docente::with('perfil')->find($id);
            if ($doc) {
                $perfil = $doc->perfil;
                $data['nombre'] = "{$perfil?->primer_nombre} {$perfil?->apellido_paterno}";
                if ($perfil?->celular) {
                    $data['contactos'][] = [
                        'label'    => 'Personal',
                        'nombre'   => 'Docente',
                        'telefono' => $perfil->celular
                    ];
                }
            }
        }

        return response()->json($data);
    }

    /**
     * Export all attendance for a month.
     */
    public function exportAll(Request $request)
    {
        $tipo = $request->query('tipo', 'E');
        $fechaInicio = $request->query('fecha_inicio');
        $fechaFin = $request->query('fecha_fin');
        $mes = $request->query('mes', date('m'));
        $anio = $request->query('anio', date('Y'));

        $filters = $request->only(['nivel_id', 'grado_id', 'seccion_id', 'anio']);
        $instiId = auth()->user()->insti_id ?? 1;

        // Handle both month/year and specific range
        if ($fechaInicio && $fechaFin) {
            $reporte = $this->service->reporteMes($instiId, $tipo, (int)$anio, (int)$mes, $filters); 
            $periodoLabel = "Desde {$fechaInicio} hasta {$fechaFin}";
        } else {
            $reporte = $this->service->reporteMes($instiId, $tipo, (int)$anio, (int)$mes, $filters);
            $periodoLabel = "Periodo: {$mes}/{$anio}";
        }

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->mergeCells('A1:E1');
        $sheet->setCellValue('A1', "Reporte Consolidado de Asistencia - " . ($tipo === 'E' ? 'Estudiantes' : 'Docentes'));
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        
        $sheet->setCellValue('A2', $periodoLabel);
        
        $sheet->setCellValue('A4', '#')->setCellValue('B4', 'Nombre Completo')
              ->setCellValue('C4', 'Asistencias')->setCellValue('D4', 'Tardanzas')->setCellValue('E4', 'Faltas');
        
        $sheet->getStyle('A4:E4')->getFont()->setBold(true);

        $fila = 5;
        foreach ($reporte as $idx => $item) {
            $sheet->setCellValue('A' . $fila, $idx + 1);
            $sheet->setCellValue('B' . $fila, $item['nombre_completo']);
            $sheet->setCellValue('C' . $fila, $item['total_asistio']);
            $sheet->setCellValue('D' . $fila, $item['total_tardanza']);
            $sheet->setCellValue('E' . $fila, $item['total_falto']);
            $fila++;
        }

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $filename = "Asistencia_General_" . ($tipo === 'E' ? 'Estudiantes' : 'Docentes') . "_" . date('Ymd_His') . ".xlsx";
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_all');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
    }
}
