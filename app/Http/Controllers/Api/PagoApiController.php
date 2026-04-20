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
            ->value('nombre') ?? 'Institución';

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