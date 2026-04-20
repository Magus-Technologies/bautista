<?php

namespace App\Repositories\Implements;

use App\Models\Estudiante;
use App\Models\Pago;
use App\Models\PadreApoderado;
use Illuminate\Support\Facades\DB;
use App\Repositories\Interfaces\PagoRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class PagoRepository implements PagoRepositoryInterface
{
    public function paginateEstudiantesConPagador(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        return DB::table('estudiantes as es')
            ->join('estudiante_contacto as ec', 'es.estu_id', '=', 'ec.estu_id')
            ->join('padre_apoderado as p', 'ec.contacto_id', '=', 'p.id_contacto')
            ->leftJoin('users as u', 'p.user_id', '=', 'u.id')
            ->leftJoin(DB::raw('(SELECT estu_id, COUNT(*) as pagos_count FROM pagos GROUP BY estu_id) as pag'), 'es.estu_id', '=', 'pag.estu_id')
            ->where('p.insti_id', $instiId)
            ->where('p.es_pagador', '1')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sq) use ($search) {
                    $sq->where('p.nombres', 'like', "%{$search}%")
                       ->orWhere('p.apellidos', 'like', "%{$search}%")
                       ->orWhere('p.numero_doc', 'like', "%{$search}%");
                });
            })
            ->select([
                'u.id as id_usuario',
                'p.nombres',
                'p.apellidos',
                'p.telefono_1',
                'p.numero_doc',
                'ec.mensualidad',
                'es.estu_id',
                'p.id_contacto',
                DB::raw('COALESCE(pag.pagos_count, 0) as pagos_count')
            ])
            ->orderBy('es.estu_id', 'desc')
            ->paginate($perPage);
    }

    public function paginatePagadores(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        return PadreApoderado::with(['estudiantes.perfil'])
            ->withCount('pagos')
            ->where('insti_id', $instiId)
            ->where('es_pagador', '1')
            ->when($search, fn ($q) => $q
                ->where('nombres', 'like', "%{$search}%")
                ->orWhere('apellidos', 'like', "%{$search}%")
                ->orWhere('numero_doc', 'like', "%{$search}%")
            )
            ->latest('id_contacto')
            ->paginate($perPage);
    }

    public function pagosPorContacto(int $contactoId): Collection
    {
        return Pago::where('contacto_id', $contactoId)
            ->orderBy('pag_anual', 'desc')
            ->orderByRaw("FIELD(pag_mes, 'ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE') DESC")
            ->get();
    }

    public function findById(int $id): Pago
    {
        return Pago::findOrFail($id);
    }

    public function create(array $data): Pago
    {
        return Pago::create($data);
    }

    public function update(Pago $pago, array $data): Pago
    {
        $pago->update($data);
        return $pago->fresh();
    }

    public function delete(Pago $pago): void
    {
        $pago->delete();
    }

    public function dashboard(int $instiId, string $mes, int $anio): array
    {
        $base = Pago::where('insti_id', $instiId)
            ->where('pag_mes', $mes)
            ->where('pag_anual', $anio);

        $totalRegistros  = (clone $base)->count();
        $totalPagados    = (clone $base)->where('estatus', 1)->count();
        $totalPendientes = (clone $base)->where('estatus', 0)->count();
        $totalRecaudado  = (clone $base)->where('estatus', 1)->sum('total');

        $vouchersPendientes = \App\Models\PagoNotifica::where('estado', 'pendiente')
            ->whereHas('pago', fn ($q) => $q->where('insti_id', $instiId))
            ->count();

        $porcentaje = $totalRegistros > 0
            ? round(($totalPagados / $totalRegistros) * 100, 1)
            : 0;

        return [
            'total_recaudado'     => (float) $totalRecaudado,
            'total_pendientes'    => $totalPendientes,
            'vouchers_pendientes' => $vouchersPendientes,
            'porcentaje_cobranza' => $porcentaje,
            'total_registros'     => $totalRegistros,
        ];
    }

    public function vencidos(int $instiId): Collection
    {
        $meses = [
            'ENERO' => 1, 'FEBRERO' => 2, 'MARZO' => 3, 'ABRIL' => 4,
            'MAYO' => 5, 'JUNIO' => 6, 'JULIO' => 7, 'AGOSTO' => 8,
            'SEPTIEMBRE' => 9, 'OCTUBRE' => 10, 'NOVIEMBRE' => 11, 'DICIEMBRE' => 12,
        ];

        $caseMonth = 'CASE pag_mes';
        foreach ($meses as $nombre => $num) {
            $caseMonth .= " WHEN '{$nombre}' THEN {$num}";
        }
        $caseMonth .= ' ELSE 1 END';

        $fechaLimite = now()->subDays(30)->toDateString();

        return Pago::with(['estudiante.perfil'])
            ->where('insti_id', $instiId)
            ->where('estatus', 0)
            ->where(function ($q) use ($caseMonth, $fechaLimite) {
                $q->where(function ($sq) use ($fechaLimite) {
                    $sq->whereNotNull('pag_fecha')
                       ->where('pag_fecha', '<', $fechaLimite);
                })->orWhere(function ($sq) use ($caseMonth, $fechaLimite) {
                    $sq->whereNull('pag_fecha')
                       ->whereRaw(
                           "STR_TO_DATE(CONCAT('01/', ({$caseMonth}), '/', pag_anual), '%d/%c/%Y') < ?",
                           [$fechaLimite]
                       );
                });
            })
            ->selectRaw("pagos.*, DATEDIFF(NOW(), COALESCE(pag_fecha,
                STR_TO_DATE(CONCAT('01/', ({$caseMonth}), '/', pag_anual), '%d/%c/%Y')
            )) as dias_vencimiento")
            ->orderByDesc('dias_vencimiento')
            ->get();
    }

    public function crearMensualidades(int $instiId, string $mes, int $anio): array
    {
        $today = now()->toDateString();

        // Include grado_id via current year matricula
        $estudiantes = DB::table('estudiantes as es')
            ->join('estudiante_contacto as ec', 'es.estu_id', '=', 'ec.estu_id')
            ->join('padre_apoderado as pa', 'ec.contacto_id', '=', 'pa.id_contacto')
            ->leftJoin('matriculas as m', function ($join) use ($anio) {
                $join->on('es.estu_id', '=', 'm.estu_id')->where('m.anio', '=', $anio);
            })
            ->leftJoin('secciones as s', 'm.seccion_id', '=', 's.seccion_id')
            ->where('pa.insti_id', $instiId)
            ->where('pa.es_pagador', '1')
            ->select('es.estu_id', 'ec.contacto_id', 'ec.mensualidad', 'ec.dia_pago', 's.id_grado as grado_id')
            ->get();

        // Mapa de número de mes para calcular la fecha de vencimiento
        $mesesNum = [
            'ENERO' => 1, 'FEBRERO' => 2, 'MARZO' => 3, 'ABRIL' => 4,
            'MAYO' => 5, 'JUNIO' => 6, 'JULIO' => 7, 'AGOSTO' => 8,
            'SEPTIEMBRE' => 9, 'OCTUBRE' => 10, 'NOVIEMBRE' => 11, 'DICIEMBRE' => 12,
        ];
        $numMes = $mesesNum[$mes] ?? now()->month;

        $creados  = 0;
        $omitidos = 0;

        foreach ($estudiantes as $est) {
            $existe = Pago::where('estu_id', $est->estu_id)
                ->where('pag_mes', $mes)
                ->where('pag_anual', $anio)
                ->exists();

            if ($existe) {
                $omitidos++;
                continue;
            }

            // Req 11.4/11.5: resolve tariff with fallback chain
            $monto = $this->resolverTarifa($instiId, $est->grado_id, $anio, $est->mensualidad);

            // Req 12.4: apply active discounts
            [$montoFinal, $observacion] = $this->aplicarDescuentos($est->estu_id, $monto, $today);

            // Calcular fecha de vencimiento usando dia_pago del contacto o día 1 por defecto
            $diaPago = $est->dia_pago ?? 1;
            // Asegurar que el día no exceda el último día del mes
            $ultimoDia = cal_days_in_month(CAL_GREGORIAN, $numMes, $anio);
            $diaPago   = min($diaPago, $ultimoDia);
            $fechaPago = sprintf('%04d-%02d-%02d', $anio, $numMes, $diaPago);

            Pago::create([
                'insti_id'    => $instiId,
                'estu_id'     => $est->estu_id,
                'contacto_id' => $est->contacto_id,
                'pag_anual'   => $anio,
                'pag_mes'     => $mes,
                'pag_monto'   => $montoFinal,
                'pag_otro1'   => 0,
                'pag_otro2'   => 0,
                'total'       => $montoFinal,
                'estatus'     => 0,
                'pag_fecha'   => $fechaPago,
                'observacion' => $observacion,
            ]);
            $creados++;
        }

        return [
            'creados'  => $creados,
            'omitidos' => $omitidos,
            'total'    => $estudiantes->count(),
        ];
    }

    private function resolverTarifa(int $instiId, ?int $gradoId, int $anio, ?string $fallback): float
    {
        $base = DB::table('tarifa_pago as tp')
            ->join('concepto_pago as cp', 'tp.concepto_id', '=', 'cp.concepto_id')
            ->where('tp.insti_id', $instiId)
            ->where('tp.anio_escolar', $anio)
            ->where('tp.activo', 1)
            ->where('cp.periodicidad', 'mensual')
            ->where('cp.activo', 1);

        if ($gradoId) {
            $monto = (clone $base)->where('tp.grado_id', $gradoId)->value('tp.monto');
            if ($monto !== null) {
                return (float) $monto;
            }
        }

        $monto = (clone $base)->whereNull('tp.grado_id')->value('tp.monto');
        if ($monto !== null) {
            return (float) $monto;
        }

        return (float) ($fallback ?? 0);
    }

    private function aplicarDescuentos(int $estuId, float $monto, string $fecha): array
    {
        $descuentos = \App\Models\DescuentoAlumno::where('estu_id', $estuId)
            ->where('activo', 1)
            ->where('fecha_inicio', '<=', $fecha)
            ->where(function ($q) use ($fecha) {
                $q->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', $fecha);
            })
            ->get();

        if ($descuentos->isEmpty()) {
            return [$monto, null];
        }

        $montoOriginal = $monto;
        $detalles      = [];

        foreach ($descuentos as $d) {
            if ($d->tipo === 'porcentaje') {
                $descuento = round($monto * ((float) $d->valor / 100), 2);
                $monto     = max($monto - $descuento, 0);
                $detalles[] = "Desc. {$d->motivo} {$d->valor}% (-S/ {$descuento})";
            } else {
                $descuento  = min((float) $d->valor, $monto);
                $monto      = max($monto - $descuento, 0);
                $detalles[] = "Desc. {$d->motivo} -S/ " . number_format($descuento, 2);
            }
        }

        $obs = 'Original S/ ' . number_format($montoOriginal, 2) . '. ' . implode('. ', $detalles);

        return [$monto, $obs];
    }

    public function historialAlumno(int $instiId, int $estuId): array
    {
        $estudiante = \App\Models\Estudiante::with('perfil')
            ->where('estu_id', $estuId)
            ->firstOrFail();

        $pagos = Pago::with('notificas')
            ->where('insti_id', $instiId)
            ->where('estu_id', $estuId)
            ->orderBy('pag_anual', 'desc')
            ->orderByRaw("FIELD(pag_mes,'ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE') DESC")
            ->get();

        $totalPagado    = $pagos->where('estatus', 1)->sum('total');
        $totalPendiente = $pagos->where('estatus', 0)->sum('total');

        return [
            'estudiante' => [
                'estu_id' => $estudiante->estu_id,
                'nombre'  => $estudiante->perfil
                    ? "{$estudiante->perfil->primer_nombre} {$estudiante->perfil->apellido_paterno} {$estudiante->perfil->apellido_materno}"
                    : "Est. #{$estuId}",
            ],
            'resumen' => [
                'total_pagado'       => (float) $totalPagado,
                'total_pendiente'    => (float) $totalPendiente,
                'meses_registrados'  => $pagos->count(),
            ],
            'pagos' => $pagos->map(fn ($p) => [
                'pag_id'      => $p->pag_id,
                'pag_mes'     => $p->pag_mes,
                'pag_anual'   => $p->pag_anual,
                'pag_monto'   => (float) $p->pag_monto,
                'pag_nombre1' => $p->pag_nombre1,
                'pag_otro1'   => (float) $p->pag_otro1,
                'pag_nombre2' => $p->pag_nombre2,
                'pag_otro2'   => (float) $p->pag_otro2,
                'total'       => (float) $p->total,
                'estatus'     => $p->estatus,
                'pag_fecha'   => $p->pag_fecha?->toDateString(),
                'observacion' => $p->observacion,
                'vouchers'    => $p->notificas->map(fn ($v) => [
                    'id'         => $v->id,
                    'estado'     => $v->estado,
                    'comentario' => $v->comentario,
                    'archivo'    => $v->archivo,
                    'created_at' => $v->created_at?->toDateString(),
                ]),
            ])->values(),
            'descuentos_activos' => \App\Models\DescuentoAlumno::where('estu_id', $estuId)
                ->where('activo', 1)
                ->where('fecha_inicio', '<=', now()->toDateString())
                ->where(function ($q) {
                    $q->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', now()->toDateString());
                })
                ->get()
                ->map(fn ($d) => [
                    'motivo'       => $d->motivo,
                    'tipo'         => $d->tipo,
                    'valor'        => (float) $d->valor,
                    'fecha_inicio' => $d->fecha_inicio?->toDateString(),
                    'fecha_fin'    => $d->fecha_fin?->toDateString(),
                    'observacion'  => $d->observacion,
                ])
                ->values(),
        ];
    }

    public function reporteConsolidado(int $instiId, string $mes, int $anio): array
    {
        $rows = DB::select("
            SELECT
                ne.nivel_id,
                ne.nombre_nivel,
                g.grado_id,
                g.nombre_grado,
                COUNT(*)                                                        AS total_pagos,
                SUM(CASE WHEN p.estatus = 1 THEN 1 ELSE 0 END)                 AS pagos_realizados,
                SUM(CASE WHEN p.estatus = 0 THEN 1 ELSE 0 END)                 AS pagos_pendientes,
                SUM(CASE WHEN p.estatus = 1 THEN p.total ELSE 0 END)           AS monto_recaudado,
                SUM(CASE WHEN p.estatus = 0 THEN p.total ELSE 0 END)           AS monto_pendiente,
                ROUND(
                    SUM(CASE WHEN p.estatus = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100,
                    1
                )                                                               AS porcentaje_cobranza
            FROM pagos p
            INNER JOIN matriculas m  ON p.estu_id    = m.estu_id AND m.anio = p.pag_anual
            INNER JOIN secciones s   ON m.seccion_id = s.seccion_id
            INNER JOIN grados g      ON s.id_grado   = g.grado_id
            INNER JOIN niveles_educativos ne ON g.nivel_id = ne.nivel_id
            WHERE p.insti_id = ? AND p.pag_mes = ? AND p.pag_anual = ?
            GROUP BY ne.nivel_id, g.grado_id
            HAVING COUNT(*) > 0
            ORDER BY ne.nombre_nivel, g.nombre_grado
        ", [$instiId, $mes, $anio]);

        return array_map(fn ($r) => (array) $r, $rows);
    }
}