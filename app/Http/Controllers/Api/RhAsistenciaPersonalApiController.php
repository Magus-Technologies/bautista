<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRhAsistenciaPersonalRequest;
use App\Http\Requests\UpdateRhAsistenciaPersonalRequest;
use App\Http\Resources\RhAsistenciaPersonalResource;
use App\Services\Interfaces\RhAsistenciaPersonalServiceInterface;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class RhAsistenciaPersonalApiController extends Controller
{
    public function __construct(
        private RhAsistenciaPersonalServiceInterface $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $instiId = $request->user()->insti_id;
        $filters = [
            'user_id' => $request->input('user_id'),
            'fecha_desde' => $request->input('fecha_desde'),
            'fecha_hasta' => $request->input('fecha_hasta'),
            'estado' => $request->input('estado'),
        ];
        $perPage = $request->input('per_page', 15);

        $asistencias = $this->service->paginate($instiId, $filters, $perPage);

        return response()->json([
            'data' => RhAsistenciaPersonalResource::collection($asistencias->items()),
            'current_page' => $asistencias->currentPage(),
            'last_page' => $asistencias->lastPage(),
            'per_page' => $asistencias->perPage(),
            'total' => $asistencias->total(),
            'from' => $asistencias->firstItem(),
            'to' => $asistencias->lastItem(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $asistencia = $this->service->findById($id);
        return response()->json(new RhAsistenciaPersonalResource($asistencia));
    }

    public function registrarEntrada(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $instiId = $request->user()->insti_id;
        $observaciones = $request->input('observaciones');

        $asistencia = $this->service->registrarEntrada($userId, $instiId, $observaciones);

        return response()->json([
            'message' => 'Entrada registrada exitosamente',
            'data' => new RhAsistenciaPersonalResource($asistencia),
        ], 201);
    }

    public function registrarSalida(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $asistencia = $this->service->registrarSalida($userId);

        return response()->json([
            'message' => 'Salida registrada exitosamente',
            'data' => new RhAsistenciaPersonalResource($asistencia),
        ]);
    }

    public function registrarManual(StoreRhAsistenciaPersonalRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['insti_id'] = $request->user()->insti_id;
        $data['registrado_por'] = $request->user()->id;

        $asistencia = $this->service->registrarManual($data);

        return response()->json([
            'message' => 'Asistencia registrada exitosamente',
            'data' => new RhAsistenciaPersonalResource($asistencia),
        ], 201);
    }

    public function update(UpdateRhAsistenciaPersonalRequest $request, int $id): JsonResponse
    {
        $asistencia = $this->service->update($id, $request->validated());

        return response()->json([
            'message' => 'Asistencia actualizada exitosamente',
            'data' => new RhAsistenciaPersonalResource($asistencia),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return response()->json([
            'message' => 'Asistencia eliminada exitosamente',
        ]);
    }

    public function reportePeriodo(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'mes' => 'required|integer|min:1|max:12',
            'anio' => 'required|integer|min:2020',
        ]);

        $reporte = $this->service->getReportePeriodo(
            $request->user_id,
            $request->mes,
            $request->anio
        );

        return response()->json([
            'data' => RhAsistenciaPersonalResource::collection($reporte['asistencias']),
            'estadisticas' => $reporte['estadisticas'],
        ]);
    }

    public function exportarPdf(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'mes'     => 'required|integer|min:1|max:12',
            'anio'    => 'required|integer|min:2020',
        ]);

        $reporte      = $this->service->getReportePeriodo($request->user_id, $request->mes, $request->anio);
        $user         = \App\Models\User::with('perfil')->findOrFail($request->user_id);
        $institucion  = $request->user()->institucion;
        $periodoLabel = Carbon::createFromDate($request->anio, $request->mes, 1)
            ->translatedFormat('F Y');

        $pdf = Pdf::loadView('pdf.reporte-asistencia', [
            'asistencias'  => $reporte['asistencias'],
            'estadisticas' => $reporte['estadisticas'],
            'trabajador'   => $user->nombre_completo,
            'periodoLabel' => ucfirst($periodoLabel),
            'institucion'  => $institucion,
        ])->setPaper('a4', 'portrait');

        $filename = "reporte_asistencia_{$user->nombre_completo}_{$request->mes}_{$request->anio}.pdf";

        return $pdf->stream($filename);
    }

    public function exportarExcel(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'mes'     => 'required|integer|min:1|max:12',
            'anio'    => 'required|integer|min:2020',
        ]);

        $reporte      = $this->service->getReportePeriodo($request->user_id, $request->mes, $request->anio);
        $user         = \App\Models\User::findOrFail($request->user_id);
        $stats        = $reporte['estadisticas'];
        $asistencias  = $reporte['asistencias'];
        $periodoLabel = ucfirst(Carbon::createFromDate($request->anio, $request->mes, 1)->translatedFormat('F Y'));

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Asistencia');

        $verde      = '1A7A4A';
        $verdeclaro = 'D1FAE5';
        $grisclaro  = 'F1F5F9';
        $gris       = 'E2E8F0';
        $blanco     = 'FFFFFF';
        $negro      = '1A1A1A';

        $thin = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color'       => ['argb' => 'FF' . $gris],
                ],
            ],
        ];

        // ── FILA 1: Título principal ───────────────────────────────────────
        $sheet->mergeCells('A1:H1');
        $sheet->setCellValue('A1', 'REPORTE DE ASISTENCIA PERSONAL');
        $sheet->getStyle('A1')->applyFromArray([
            'font'      => ['bold' => true, 'size' => 14, 'color' => ['argb' => 'FF' . $blanco]],
            'fill'      => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF' . $verde]],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(28);

        // ── FILAS 2-3: Info del trabajador ────────────────────────────────
        $sheet->mergeCells('A2:D2');
        $sheet->mergeCells('E2:H2');
        $sheet->setCellValue('A2', 'Trabajador: ' . $user->nombre_completo);
        $sheet->setCellValue('E2', 'Período: ' . $periodoLabel);

        $sheet->mergeCells('A3:D3');
        $sheet->mergeCells('E3:H3');
        $sheet->setCellValue('A3', 'Fecha de generación: ' . now()->format('d/m/Y H:i'));
        $sheet->setCellValue('E3', 'Total registros: ' . count($asistencias));

        foreach (['A2:H3'] as $range) {
            $sheet->getStyle($range)->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'color' => ['argb' => 'FF' . $negro]],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF' . $verdeclaro]],
                'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['argb' => 'FF' . $verde]]],
            ]);
        }

        // ── FILA 5: Estadísticas resumen ──────────────────────────────────
        $statsData = [
            ['Días Presentes',    $stats['dias_presentes'],                   '059669'],
            ['Días Ausentes',     $stats['dias_ausentes'],                    'DC2626'],
            ['Tardanzas',         $stats['total_tardanzas'],                  'D97706'],
            ['Min. Tardanza',     ($stats['minutos_tardanza_total'] ?? 0).' min', 'EA580C'],
            ['Min. Sal. Antic.',  ($stats['minutos_salida_anticipada'] ?? 0).' min', 'EA580C'],
            ['Total Descuentos',  'S/ '.number_format($stats['total_descuentos'], 2), 'DC2626'],
        ];

        $statCols = ['A', 'B', 'C', 'D', 'E', 'F'];
        // Fila 5: etiquetas, Fila 6: valores (reservamos fila 4 vacía como separador)
        $sheet->getRowDimension(4)->setRowHeight(8);
        foreach ($statsData as $idx => $s) {
            $col = $statCols[$idx];
            $sheet->setCellValue("{$col}5", $s[0]);
            $sheet->setCellValue("{$col}6", $s[1]);
            $sheet->getStyle("{$col}5")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 8, 'color' => ['argb' => 'FF666666']],
                'fill'      => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF8FAFC']],
                'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
                'borders'   => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['argb' => 'FF' . $gris]]],
            ]);
            $sheet->getStyle("{$col}6")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 11, 'color' => ['argb' => 'FF' . $s[2]]],
                'fill'      => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFFFFFFF']],
                'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
                'borders'   => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['argb' => 'FF' . $gris]]],
            ]);
            $sheet->getRowDimension(5)->setRowHeight(16);
            $sheet->getRowDimension(6)->setRowHeight(20);
        }

        // ── FILA 8: Cabecera de la tabla (fila 7 vacía como separador) ────
        $sheet->getRowDimension(7)->setRowHeight(8);
        $headers = ['#', 'Fecha', 'Entrada', 'Salida', 'Estado', 'Min. Tardanza', 'Min. Sal. Antic.', 'Descuento (S/)'];
        foreach ($headers as $i => $header) {
            $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
            $sheet->setCellValue("{$col}8", $header);
        }
        $sheet->getStyle('A8:H8')->applyFromArray([
            'font'      => ['bold' => true, 'size' => 10, 'color' => ['argb' => 'FF' . $blanco]],
            'fill'      => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF' . $verde]],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
            'borders'   => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['argb' => 'FF' . $verde]]],
        ]);
        $sheet->getRowDimension(8)->setRowHeight(18);

        // ── FILAS DE DATOS ────────────────────────────────────────────────
        foreach ($asistencias as $i => $a) {
            $row = $i + 9;
            $sheet->setCellValue("A{$row}", $i + 1);
            $sheet->setCellValue("B{$row}", $a->fecha?->format('d/m/Y') ?? '');
            $sheet->setCellValue("C{$row}", $a->hora_entrada ? substr($a->hora_entrada, 0, 5) : '—');
            $sheet->setCellValue("D{$row}", $a->hora_salida  ? substr($a->hora_salida,  0, 5) : '—');
            $sheet->setCellValue("E{$row}", $a->estado_label ?? $a->estado);
            $sheet->setCellValue("F{$row}", ($a->minutos_tardanza ?? 0) > 0 ? ($a->minutos_tardanza . ' min') : '—');
            $sheet->setCellValue("G{$row}", ($a->minutos_salida_anticipada ?? 0) > 0 ? ($a->minutos_salida_anticipada . ' min') : '—');
            $sheet->setCellValue("H{$row}", (float) $a->descuento_aplicado > 0 ? 'S/ ' . number_format((float) $a->descuento_aplicado, 2) : '—');

            $bgFill = $i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
            $sheet->getStyle("A{$row}:H{$row}")->applyFromArray([
                'fill'      => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => $bgFill]],
                'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
                'borders'   => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['argb' => 'FF' . $gris]]],
                'font'      => ['size' => 10],
            ]);

            // Columna B: alineación izquierda
            $sheet->getStyle("B{$row}")->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_LEFT);
            // Columna E: color según estado
            $estadoColor = match($a->estado) { 'presente' => '065F46', 'ausente' => '991B1B', 'tardanza' => '92400E', 'licencia' => '1E40AF', default => $negro };
            $sheet->getStyle("E{$row}")->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FF' . $estadoColor))->setBold(true);
            // Descuento en rojo si > 0
            if ((float) $a->descuento_aplicado > 0) {
                $sheet->getStyle("H{$row}")->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFDC2626'))->setBold(true);
            }
            $sheet->getRowDimension($row)->setRowHeight(16);
        }

        // ── FILA TOTAL ────────────────────────────────────────────────────
        $totalRow = count($asistencias) + 9;
        $sheet->mergeCells("A{$totalRow}:G{$totalRow}");
        $sheet->setCellValue("A{$totalRow}", 'TOTAL DESCUENTOS');
        $sheet->setCellValue("H{$totalRow}", 'S/ ' . number_format($stats['total_descuentos'], 2));
        $sheet->getStyle("A{$totalRow}:H{$totalRow}")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 10, 'color' => ['argb' => 'FFDC2626']],
            'fill'      => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFFEE2E2']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
            'borders'   => ['outline' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_MEDIUM, 'color' => ['argb' => 'FFDC2626']]],
        ]);
        $sheet->getRowDimension($totalRow)->setRowHeight(18);

        // ── ANCHOS DE COLUMNA ─────────────────────────────────────────────
        $widths = ['A' => 6, 'B' => 14, 'C' => 10, 'D' => 10, 'E' => 14, 'F' => 14, 'G' => 16, 'H' => 16];
        foreach ($widths as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        // Freeze encabezado
        $sheet->freezePane('A9');

        $filename = "reporte_asistencia_{$user->nombre_completo}_{$request->mes}_{$request->anio}.xlsx";

        $writer = new Xlsx($spreadsheet);
        ob_start();
        $writer->save('php://output');
        $content = ob_get_clean();

        return response($content, 200, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
