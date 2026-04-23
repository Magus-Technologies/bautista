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

    // ── Detalle de pagador (vista completa con tabs) ──────────────────────

    public function detallePagador(Request $request, int $contactoId)
    {
        // Obtener información del pagador con sus estudiantes
        $pagador = \App\Models\PadreApoderado::with('estudiantes')->findOrFail($contactoId);

        // Obtener el primer estudiante asociado (o null si no tiene)
        $estudiante = $pagador->estudiantes->first();

        // Sincronización automática de deuda pendiente (Estado de Cuenta)
        if ($estudiante) {
            $this->service->sincronizarPagos($request->user()->insti_id, $estudiante->estu_id, now()->year);
        }

        // Obtener todos los pagos del contacto (ahora incluirá los recién creados)
        $pagos = $this->service->pagosPorContacto($contactoId);

        // Obtener conceptos activos
        $conceptos = \App\Models\ConceptoPago::where('insti_id', $request->user()->insti_id)
            ->where('activo', 1)
            ->get();

        return inertia('Pagos/DetallePagador', [
            'pagador' => [
                'id_contacto' => $pagador->id_contacto,
                'nombres' => $pagador->nombres,
                'apellidos' => $pagador->apellidos,
                'numero_doc' => $pagador->numero_doc,
                'telefono_1' => $pagador->telefono_1,
                'estudiante_id' => $estudiante?->estu_id,
                'grado' => $estudiante?->matriculas()->where('anio', now()->year)->first()?->seccion?->grado?->nombre_grado,
                'seccion' => $estudiante?->matriculas()->where('anio', now()->year)->first()?->seccion?->nombre,
            ],
            'pagos' => PagoResource::collection($pagos),
            'conceptos' => $conceptos->map(fn($c) => [
                'concepto_id' => $c->concepto_id,
                'nombre' => $c->nombre,
                'unico' => $c->unico,
                'periodicidad' => $c->periodicidad,
            ]),
        ]);
    }

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

    public function porContacto(Request $request, int $contactoId): AnonymousResourceCollection
    {
        $conceptoId = $request->get('concepto_id');
        return PagoResource::collection(
            $this->service->pagosPorContacto($contactoId, $conceptoId ? (int) $conceptoId : null)
        );
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

    public function generarIndividual(Request $request, int $estuId): JsonResponse
    {
        $mesesValidos = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                         'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

        $request->validate([
            'mes'  => ['required', Rule::in($mesesValidos)],
            'anio' => ['required', 'integer', 'min:2020', 'max:2099'],
        ]);

        $resultado = $this->service->generarMensualidadAlumno(
            instiId: $request->user()->insti_id,
            estuId:  $estuId,
            mes:     strtoupper($request->input('mes')),
            anio:    (int) $request->input('anio'),
        );

        if ($resultado['status'] === 'error') {
            return response()->json($resultado, 404);
        }
        if ($resultado['status'] === 'exists') {
            return response()->json($resultado, 422);
        }

        return response()->json($resultado, 201);
    }

    public function sugerido(Request $request, int $estuId): JsonResponse
    {
        $anio = (int) $request->get('anio', now()->year);

        $data = $this->service->obtenerMontoSugerido(
            $request->user()->insti_id,
            $estuId,
            $anio
        );

        return response()->json($data);
    }

    public function sincronizar(Request $request, int $estuId): JsonResponse
    {
        $anio = (int) $request->get('anio', now()->year);
        $resultado = $this->service->sincronizarPagos(
            $request->user()->insti_id,
            $estuId,
            $anio
        );

        if ($resultado['status'] === 'error') {
            return response()->json($resultado, 404);
        }

        return response()->json($resultado);
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
            'anio'       => ['required', 'integer'],
            'conceptos'  => ['required', 'array'],
            'conceptos.*.monto'  => ['required', 'numeric', 'min:0'],
            'conceptos.*.nombre' => ['required', 'string'],
        ]);

        $resultado = $this->service->generarPagosMatricula(
            instiId:    $request->user()->insti_id,
            estuId:     $request->input('estu_id'),
            contactoId: $request->input('contacto_id'),
            anio:       $request->input('anio'),
            conceptos:  $request->input('conceptos'),
        );

        return response()->json($resultado);
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