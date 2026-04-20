<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePagoRequest;
use App\Http\Requests\UpdatePagoRequest;
use App\Http\Resources\EstudianteConPagadorResource;
use App\Http\Resources\PagadorResource;
use App\Http\Resources\PagoResource;
use App\Http\Resources\PagoNotificaResource;
use App\Services\Interfaces\PagoNotificaServiceInterface;
use App\Services\Interfaces\PagoServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class PagoApiController extends Controller
{
    public function __construct(
        private readonly PagoServiceInterface $service,
        private readonly PagoNotificaServiceInterface $notificaService,
    ) {}

    // ── Pagadores (lista principal) ────────────────────────────────────────

    public function indexPagadores(Request $request): AnonymousResourceCollection
    {
        // Lista de estudiantes con sus pagadores para la vista principal
        return EstudianteConPagadorResource::collection($this->service->listarEstudiantesConPagador(
            instiId: $request->user()->insti_id,
            search:  $request->get('search') ?? '',
            perPage: (int) ($request->get('per_page') ?? 20),
        ));
    }

    // ── Pagos por contacto ─────────────────────────────────────────────────

    public function porContacto(int $contactoId): AnonymousResourceCollection
    {
        return PagoResource::collection($this->service->pagosPorContacto($contactoId));
    }

    // ── CRUD de pagos ──────────────────────────────────────────────────────

    public function store(StorePagoRequest $request): JsonResponse
    {
        $pago = $this->service->crearPago(array_merge(
            $request->validated(),
            ['insti_id' => $request->user()->insti_id],
        ));

        return (new PagoResource($pago))->response()->setStatusCode(201);
    }

    public function update(UpdatePagoRequest $request, int $id): PagoResource
    {
        return new PagoResource($this->service->actualizarPago($id, $request->validated()));
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->eliminarPago($id);
        return response()->json(null, 204);
    }

    // ── Vouchers / Comprobantes de pago ───────────────────────────────────

    public function vouchers(int $pagId): AnonymousResourceCollection
    {
        return PagoNotificaResource::collection($this->notificaService->listarPorPago($pagId));
    }

    public function subirVoucher(Request $request, int $pagId): JsonResponse
    {
        $request->validate([
            'archivo' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $notifica = $this->notificaService->subirVoucher(
            pagId:   $pagId,
            userId:  $request->user()->id,
            archivo: $request->file('archivo'),
        );

        return (new PagoNotificaResource($notifica))->response()->setStatusCode(201);
    }

    public function validarVoucher(Request $request, int $notificaId): JsonResponse
    {
        $request->validate([
            'estado'     => ['required', Rule::in(['validado', 'rechazado'])],
            'comentario' => ['nullable', 'string', 'max:500'],
        ]);

        $notifica = $this->notificaService->validar(
            notificaId: $notificaId,
            estado:     $request->input('estado'),
            comentario: $request->input('comentario'),
        );

        return (new PagoNotificaResource($notifica))->response();
    }

    // ── Dashboard de cobros ───────────────────────────────────────────────

    public function dashboard(Request $request): JsonResponse
    {
        $meses = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                  'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

        $mes  = strtoupper($request->get('mes', $meses[Carbon::now()->month - 1]));
        $anio = (int) $request->get('anio', Carbon::now()->year);

        $data = $this->service->dashboard($request->user()->insti_id, $mes, $anio);

        return response()->json($data);
    }

    public function vencidos(Request $request): JsonResponse
    {
        $vencidos = $this->service->vencidos($request->user()->insti_id);

        $items = $vencidos->map(fn ($p) => [
            'pag_id'           => $p->pag_id,
            'estu_id'          => $p->estu_id,
            'alumno'           => optional($p->estudiante?->perfil)->primer_nombre . ' ' .
                                  optional($p->estudiante?->perfil)->apellido_paterno,
            'pag_mes'          => $p->pag_mes,
            'pag_anual'        => $p->pag_anual,
            'pag_monto'        => $p->pag_monto,
            'total'            => $p->total,
            'dias_vencimiento' => $p->dias_vencimiento,
        ]);

        return response()->json($items);
    }

    public function generarMensualidades(Request $request): JsonResponse
    {
        $mesesValidos = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                         'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

        $request->validate([
            'mes'  => ['required', Rule::in($mesesValidos)],
            'anio' => ['required', 'integer', 'min:2020', 'max:2099'],
        ]);

        $resultado = $this->service->generarMensualidades(
            instiId: $request->user()->insti_id,
            mes:     strtoupper($request->input('mes')),
            anio:    (int) $request->input('anio'),
        );

        return response()->json($resultado, 201);
    }

    // ── Historial por alumno ───────────────────────────────────────────────

    public function historialAlumno(Request $request, int $estuId): JsonResponse
    {
        $data = $this->service->historialAlumno($request->user()->insti_id, $estuId);
        return response()->json($data);
    }

    // ── Reporte consolidado por nivel/grado ───────────────────────────────

    public function reporteConsolidado(Request $request): JsonResponse
    {
        $meses = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                  'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

        $mes  = strtoupper($request->get('mes', $meses[Carbon::now()->month - 1]));
        $anio = (int) $request->get('anio', Carbon::now()->year);

        $data = $this->service->reporteConsolidado($request->user()->insti_id, $mes, $anio);

        return response()->json($data);
    }

    // ── Generar pagos de matrícula (conceptos únicos al inscribir) ───────────

    public function generarPagosMatricula(Request $request): JsonResponse
    {
        $request->validate([
            'estu_id'    => ['required', 'integer'],
            'contacto_id'=> ['required', 'integer'],
            'grado_id'   => ['required', 'integer'],
            'anio'       => ['required', 'integer'],
            'conceptos'  => ['required', 'array'],
            'conceptos.*.concepto_id' => ['required', 'integer'],
            'conceptos.*.monto'       => ['required', 'numeric', 'min:0'],
            'conceptos.*.nombre'      => ['required', 'string'],
        ]);

        $instiId   = $request->user()->insti_id;
        $estuId    = $request->input('estu_id');
        $contactoId= $request->input('contacto_id');
        $anio      = $request->input('anio');
        $conceptos = $request->input('conceptos');
        $today     = now()->toDateString();
        $mes       = strtoupper(now()->locale('es')->isoFormat('MMMM'));

        $creados = 0;
        foreach ($conceptos as $c) {
            // Evitar duplicados: mismo alumno + concepto + año
            $existe = \App\Models\Pago::where('estu_id', $estuId)
                ->where('pag_anual', $anio)
                ->where('pag_nombre1', $c['nombre'])
                ->exists();
            if ($existe) continue;

            \App\Models\Pago::create([
                'insti_id'    => $instiId,
                'estu_id'     => $estuId,
                'contacto_id' => $contactoId,
                'pag_anual'   => $anio,
                'pag_mes'     => $mes,
                'pag_monto'   => 0,
                'pag_nombre1' => $c['nombre'],
                'pag_otro1'   => $c['monto'],
                'pag_otro2'   => 0,
                'total'       => $c['monto'],
                'estatus'     => 0,
                'pag_fecha'   => $today,
            ]);
            $creados++;
        }

        return response()->json(['creados' => $creados]);
    }

    // ── Reporte consolidado PDF ───────────────────────────────────────────

    public function reporteConsolidadoPdf(Request $request)
    {
        $meses = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                  'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

        $mes  = strtoupper($request->get('mes', $meses[Carbon::now()->month - 1]));
        $anio = (int) $request->get('anio', Carbon::now()->year);

        $filas    = $this->service->reporteConsolidado($request->user()->insti_id, $mes, $anio);
        $byNivel  = collect($filas)->groupBy('nombre_nivel');

        $institucion = \App\Models\InstitucionEducativa::where('insti_id', $request->user()->insti_id)
            ->value('insti_razon_social') ?? 'Institución';

        $html = view('pdf.reporte-consolidado', [
            'filas'       => $filas,
            'byNivel'     => $byNivel,
            'mes'         => $mes,
            'anio'        => $anio,
            'fecha'       => Carbon::now()->format('d/m/Y H:i'),
            'institucion' => $institucion,
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'portrait');

        return $pdf->download("Reporte_Consolidado_{$mes}_{$anio}.pdf");
    }

    // ── Reporte consolidado Excel ─────────────────────────────────────────

    public function reporteConsolidadoExcel(Request $request)
    {
        $meses = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                  'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

        $mes  = strtoupper($request->get('mes', $meses[Carbon::now()->month - 1]));
        $anio = (int) $request->get('anio', Carbon::now()->year);

        $filas = $this->service->reporteConsolidado($request->user()->insti_id, $mes, $anio);

        $institucion = \App\Models\InstitucionEducativa::where('insti_id', $request->user()->insti_id)
            ->value('insti_razon_social') ?? 'Institución';

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Reporte Consolidado');

        // ── Encabezado ──────────────────────────────────────────────────
        $sheet->mergeCells('A1:I1');
        $sheet->setCellValue('A1', strtoupper($institucion));
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(13);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A2:I2');
        $sheet->setCellValue('A2', "REPORTE CONSOLIDADO DE PAGOS — {$mes} {$anio}");
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A3:I3');
        $sheet->setCellValue('A3', 'Generado: ' . Carbon::now()->format('d/m/Y H:i'));
        $sheet->getStyle('A3')->getFont()->setItalic(true)->setSize(9);
        $sheet->getStyle('A3')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        // ── Cabecera de tabla ────────────────────────────────────────────
        $headers = ['Nivel', 'Grado', 'Total Pagos', 'Pagados', 'Pendientes', 'Recaudado (S/)', 'Pendiente (S/)', '% Cobranza'];
        $cols    = ['A','B','C','D','E','F','G','H'];

        foreach ($headers as $i => $h) {
            $cell = $cols[$i] . '5';
            $sheet->setCellValue($cell, $h);
        }

        $headerRange = 'A5:H5';
        $sheet->getStyle($headerRange)->getFont()->setBold(true)->setColor(
            (new \PhpOffice\PhpSpreadsheet\Style\Color())->setARGB('FFFFFFFF')
        );
        $sheet->getStyle($headerRange)->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FF166534');
        $sheet->getStyle($headerRange)->getAlignment()
            ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        // ── Datos ────────────────────────────────────────────────────────
        $row = 6;
        foreach ($filas as $f) {
            $f = (array) $f;
            $sheet->setCellValue("A{$row}", $f['nombre_nivel']);
            $sheet->setCellValue("B{$row}", $f['nombre_grado']);
            $sheet->setCellValue("C{$row}", $f['total_pagos']);
            $sheet->setCellValue("D{$row}", $f['pagos_realizados']);
            $sheet->setCellValue("E{$row}", $f['pagos_pendientes']);
            $sheet->setCellValue("F{$row}", number_format((float)$f['monto_recaudado'], 2, '.', ''));
            $sheet->setCellValue("G{$row}", number_format((float)$f['monto_pendiente'], 2, '.', ''));
            $sheet->setCellValue("H{$row}", $f['porcentaje_cobranza']);

            // Color de fila alternada
            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:H{$row}")->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FFF0FDF4');
            }

            // Color % cobranza
            $pct = (float) $f['porcentaje_cobranza'];
            $pctColor = $pct >= 80 ? 'FF059669' : ($pct >= 50 ? 'FFD97706' : 'FFDC2626');
            $sheet->getStyle("H{$row}")->getFont()->getColor()->setARGB($pctColor);
            $sheet->getStyle("H{$row}")->getFont()->setBold(true);

            $row++;
        }

        // ── Fila de totales ──────────────────────────────────────────────
        $totalRec  = collect($filas)->sum(fn($f) => (float)((array)$f)['monto_recaudado']);
        $totalPend = collect($filas)->sum(fn($f) => (float)((array)$f)['monto_pendiente']);
        $totalPagos = collect($filas)->sum(fn($f) => (int)((array)$f)['total_pagos']);
        $totalPagados = collect($filas)->sum(fn($f) => (int)((array)$f)['pagos_realizados']);
        $totalPendientes = collect($filas)->sum(fn($f) => (int)((array)$f)['pagos_pendientes']);

        $sheet->setCellValue("A{$row}", 'TOTAL');
        $sheet->setCellValue("C{$row}", $totalPagos);
        $sheet->setCellValue("D{$row}", $totalPagados);
        $sheet->setCellValue("E{$row}", $totalPendientes);
        $sheet->setCellValue("F{$row}", number_format($totalRec, 2, '.', ''));
        $sheet->setCellValue("G{$row}", number_format($totalPend, 2, '.', ''));

        $sheet->getStyle("A{$row}:H{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}:H{$row}")->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFD1FAE5');

        // ── Bordes y auto-size ───────────────────────────────────────────
        $dataRange = "A5:H{$row}";
        $sheet->getStyle($dataRange)->getBorders()->getAllBorders()
            ->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN)
            ->getColor()->setARGB('FFE5E7EB');

        foreach ($cols as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $sheet->getStyle('C5:H' . $row)->getAlignment()
            ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        // ── Generar archivo ──────────────────────────────────────────────
        $writer   = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'reporte_pagos');
        $writer->save($tempFile);

        return response()->download($tempFile, "Reporte_Consolidado_{$mes}_{$anio}.xlsx")
            ->deleteFileAfterSend(true);
    }

    // ── Reporte PDF (pagos por contacto) ──────────────────────────────────

    public function reportePdf(Request $request)
    {
        $contactoId = $request->get('contacto_id');
        $estudianteId = $request->get('estudiante_id');
        $fechaInicio = $request->get('fecha_inicio');
        $fechaFin = $request->get('fecha_fin');

        $pagos = $this->service->pagosPorContacto((int) $contactoId);

        // Filtrar por fechas si se proporcionan
        if ($fechaInicio && $fechaFin) {
            $pagos = $pagos->filter(function ($pago) use ($fechaInicio, $fechaFin) {
                if (!$pago->pag_fecha) return false;
                $fecha = $pago->pag_fecha->format('Y-m-d');
                return $fecha >= $fechaInicio && $fecha <= $fechaFin;
            });
        }

        $total = $pagos->sum('total');

        // Obtener información del contacto
        $contacto = \App\Models\PadreApoderado::with('estudiantes')
            ->find($contactoId);

        $estudiante = $contacto->estudiantes->first();

        $subtitulo = '';
        if ($fechaInicio && $fechaFin) {
            $subtitulo = 'DESDE ' . date('d-m-Y', strtotime($fechaInicio)) . 
                        ' - HASTA ' . date('d-m-Y', strtotime($fechaFin));
        }

        $html = view('pdf.pagos', [
            'pagos' => $pagos,
            'total' => $total,
            'subtitulo' => $subtitulo,
            'contacto' => $contacto,
            'estudiante' => $estudiante,
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        return $pdf->download('Reporte_Pagos.pdf');
    }
}