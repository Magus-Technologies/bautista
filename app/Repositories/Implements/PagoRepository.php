<?php

namespace App\Repositories\Implements;

use App\Models\Pago;
use App\Repositories\Interfaces\PagoRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PagoRepository implements PagoRepositoryInterface
{
    public function paginateEstudiantesConPagador(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        return DB::table('estudiantes as es')
            ->join('perfiles as p', 'es.estu_id', '=', 'p.perfilable_id')
            ->join('users as u', 'p.user_id', '=', 'u.id')
            ->join('estudiante_contacto as ec', 'es.estu_id', '=', 'ec.estu_id')
            ->leftJoin('matriculas as m', 'es.estu_id', '=', 'm.estu_id')
            ->leftJoin('secciones as s', 'm.seccion_id', '=', 's.seccion_id')
            ->leftJoin('tarifa_pago as tp_grado', function ($join) {
                $join->on('s.id_grado', '=', 'tp_grado.grado_id')
                     ->on('tp_grado.anio_escolar', '=', 'm.anio');
            })
            ->leftJoin('tarifa_pago as tp_gral', function ($join) {
                $join->on('tp_gral.anio_escolar', '=', 'm.anio')
                     ->whereNull('tp_gral.grado_id');
            })
            ->leftJoinSub(
                DB::table('pagos')
                    ->select('estu_id', DB::raw('COUNT(*) as pagos_count'))
                    ->groupBy('estu_id'),
                'pag',
                'es.estu_id',
                '=',
                'pag.estu_id'
            )
            ->where('p.perfilable_type', 'App\\Models\\Estudiante')
            ->where('u.insti_id', $instiId)
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('p.nombres', 'like', "%{$search}%")
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
                DB::raw('COALESCE(tp_grado.monto, tp_gral.monto, ec.mensualidad, 0) as mensualidad'),
                'es.estu_id',
                'p.id_contacto',
                DB::raw('COALESCE(pag.pagos_count, 0) as pagos_count')
            ])
            ->orderBy('es.estu_id', 'desc')
            ->paginate($perPage);
    }

    public function pagosPorContacto(int $contactoId): Collection
    {
        return Pago::where('contacto_id', $contactoId)
            ->orderBy('pag_anual', 'desc')
            ->orderByRaw("FIELD(pag_mes, 'DICIEMBRE', 'NOVIEMBRE', 'OCTUBRE', 'SEPTIEMBRE', 'AGOSTO', 'JULIO', 'JUNIO', 'MAYO', 'ABRIL', 'MARZO', 'FEBRERO', 'ENERO')")
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
        return $pago;
    }

    public function delete(Pago $pago): void
    {
        $pago->delete();
    }

    public function dashboard(int $instiId, string $mes, int $anio): array
    {
        $totalRecaudado = Pago::where('insti_id', $instiId)
            ->where('pag_mes', $mes)
            ->where('pag_anual', $anio)
            ->where('estatus', 1)
            ->sum('total');

        $totalPendiente = Pago::where('insti_id', $instiId)
            ->where('pag_mes', $mes)
            ->where('pag_anual', $anio)
            ->where('estatus', 0)
            ->sum('total');

        $pagosRealizados = Pago::where('insti_id', $instiId)
            ->where('pag_mes', $mes)
            ->where('pag_anual', $anio)
            ->where('estatus', 1)
            ->count();

        $pagosPendientes = Pago::where('insti_id', $instiId)
            ->where('pag_mes', $mes)
            ->where('pag_anual', $anio)
            ->where('estatus', 0)
            ->count();

        return [
            'total_recaudado'  => (float) $totalRecaudado,
            'total_pendiente'  => (float) $totalPendiente,
            'pagos_realizados' => $pagosRealizados,
            'pagos_pendientes' => $pagosPendientes,
            'por_grado'        => $this->obtenerMetricasPorGrado($instiId, $mes, $anio),
        ];
    }

    private function obtenerMetricasPorGrado(int $instiId, string $mes, int $anio): array
    {
        $rows = DB::select("
            SELECT
                ne.nivel_id, ne.nombre_nivel, g.grado_id, g.nombre_grado,
                COUNT(*) AS total_pagos,
                SUM(CASE WHEN p.estatus = 1 THEN 1 ELSE 0 END) AS pagos_realizados,
                SUM(CASE WHEN p.estatus = 0 THEN 1 ELSE 0 END) AS pagos_pendientes,
                SUM(CASE WHEN p.estatus = 1 THEN p.total ELSE 0 END) AS monto_recaudado,
                SUM(CASE WHEN p.estatus = 0 THEN p.total ELSE 0 END) AS monto_pendiente,
                ROUND(SUM(CASE WHEN p.estatus = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) AS porcentaje_cobranza
            FROM pagos p
            INNER JOIN matriculas m  ON p.estu_id = m.estu_id AND m.anio = p.pag_anual
            INNER JOIN secciones s   ON m.seccion_id = s.seccion_id
            INNER JOIN grados g      ON s.id_grado = g.grado_id
            INNER JOIN niveles_educativos ne ON g.nivel_id = ne.nivel_id
            WHERE p.insti_id = ? AND p.pag_mes = ? AND p.pag_anual = ?
            GROUP BY ne.nivel_id, ne.nombre_nivel, g.grado_id, g.nombre_grado
            HAVING COUNT(*) > 0
            ORDER BY ne.nombre_nivel, g.nombre_grado
        ", [$instiId, $mes, $anio]);

        return array_map(fn ($r) => (array) $r, $rows);
    }

    public function vencidos(int $instiId): Collection
    {
        $caseMonth = "CASE pag_mes
            WHEN 'ENERO' THEN 1 WHEN 'FEBRERO' THEN 2 WHEN 'MARZO' THEN 3 WHEN 'ABRIL' THEN 4
            WHEN 'MAYO' THEN 5 WHEN 'JUNIO' THEN 6 WHEN 'JULIO' THEN 7 WHEN 'AGOSTO' THEN 8
            WHEN 'SEPTIEMBRE' THEN 9 WHEN 'OCTUBRE' THEN 10 WHEN 'NOVIEMBRE' THEN 11 WHEN 'DICIEMBRE' THEN 12
            ELSE 1 END";

        $fechaLimite = now()->subDays(30)->toDateString();

        return Pago::with(['estudiante.perfil'])
            ->where('insti_id', $instiId)
            ->where('estatus', 0)
            ->where(function ($q) use ($caseMonth, $fechaLimite) {
                $q->where(function ($sq) use ($fechaLimite) {
                    $sq->whereNotNull('pag_fecha')->where('pag_fecha', '<', $fechaLimite);
                })->orWhere(function ($sq) use ($caseMonth, $fechaLimite) {
                    $sq->whereNull('pag_fecha')
                       ->whereRaw("STR_TO_DATE(CONCAT('01/', ({$caseMonth}), '/', pag_anual), '%d/%c/%Y') < ?", [$fechaLimite]);
                });
            })
            ->selectRaw("pagos.*, DATEDIFF(NOW(), COALESCE(pag_fecha, STR_TO_DATE(CONCAT('01/', ({$caseMonth}), '/', pag_anual), '%d/%c/%Y'))) as dias_vencimiento")
            ->orderByDesc('dias_vencimiento')
            ->get();
    }

    public function historialAlumno(int $instiId, int $estuId): array
    {
        $pagos = Pago::where('insti_id', $instiId)
            ->where('estu_id', $estuId)
            ->orderBy('pag_anual', 'desc')
            ->orderByRaw("FIELD(pag_mes, 'DICIEMBRE', 'NOVIEMBRE', 'OCTUBRE', 'SEPTIEMBRE', 'AGOSTO', 'JULIO', 'JUNIO', 'MAYO', 'ABRIL', 'MARZO', 'FEBRERO', 'ENERO')")
            ->get();

        return [
            'pagos'   => $pagos,
            'resumen' => [
                'total_pagado'    => $pagos->where('estatus', 1)->sum('total'),
                'total_pendiente' => $pagos->where('estatus', 0)->sum('total'),
                'proximo_pago'    => $pagos->where('estatus', 0)->sortBy('pag_fecha')->first(),
            ],
        ];
    }

    public function reporteConsolidado(int $instiId, string $mes, int $anio): array
    {
        return Pago::with(['estudiante.perfil', 'estudiante.matriculas' => fn ($q) => $q->where('anio', $anio)->with('seccion.grado')])
            ->where('insti_id', $instiId)
            ->where('pag_mes', $mes)
            ->where('pag_anual', $anio)
            ->get()
            ->map(fn ($p) => [
                'estu_id'  => $p->estu_id,
                'alumno'   => $p->estudiante->perfil->primer_nombre . ' ' . $p->estudiante->perfil->apellido_paterno,
                'grado'    => $p->estudiante->matriculas->first()?->seccion?->grado?->nombre_grado ?? 'N/A',
                'seccion'  => $p->estudiante->matriculas->first()?->seccion?->nombre ?? 'N/A',
                'monto'    => (float) $p->total,
                'estatus'  => $p->estatus === 1 ? 'Pagado' : 'Pendiente',
                'fecha'    => $p->pag_fecha?->format('d/m/Y') ?? 'N/A',
            ])->toArray();
    }

    public function getEstudiantesParaGeneracion(int $instiId, int $anio): Collection
    {
        return DB::table('estudiantes as es')
            ->join('estudiante_contacto as ec', 'es.estu_id', '=', 'ec.estu_id')
            ->join('padre_apoderado as pa', 'ec.contacto_id', '=', 'pa.id_contacto')
            ->leftJoin('matriculas as m', fn($join) => $join->on('es.estu_id', '=', 'm.estu_id')->where('m.anio', $anio))
            ->leftJoin('secciones as s', 'm.seccion_id', '=', 's.seccion_id')
            ->leftJoin('grados as g', 's.id_grado', '=', 'g.grado_id')
            ->where('pa.insti_id', $instiId)
            ->where('pa.es_pagador', '1')
            ->select('es.estu_id', 'ec.contacto_id', 'ec.mensualidad', 'ec.dia_pago', 's.id_grado as grado_id', 'g.nivel_id')
            ->get();
    }

    public function getMontoTarifa(int $instiId, ?int $gradoId, int $anio, string $periodicidad): ?float
    {
        $base = DB::table('tarifa_pago as tp')
            ->join('concepto_pago as cp', 'tp.concepto_id', '=', 'cp.concepto_id')
            ->where('tp.insti_id', $instiId)
            ->where('tp.anio_escolar', $anio)
            ->where('tp.activo', 1)
            ->where('cp.periodicidad', $periodicidad)
            ->where('cp.activo', 1);

        if ($gradoId) {
            $monto = (clone $base)->where('tp.grado_id', $gradoId)->value('tp.monto');
            if ($monto !== null) return (float) $monto;
        }

        $monto = (clone $base)->whereNull('tp.grado_id')->value('tp.monto');
        return $monto !== null ? (float) $monto : null;
    }

    public function getDescuentosEstudiante(int $estuId, string $fecha, ?int $conceptoId, ?int $nivelId = null, ?int $gradoId = null): Collection
    {
        return \App\Models\DescuentoAlumno::where('activo', 1)
            ->where('fecha_inicio', '<=', $fecha)
            ->where(function ($q) use ($fecha) {
                $q->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', $fecha);
            })
            ->where(function ($q) use ($estuId, $nivelId, $gradoId) {
                $q->where('estu_id', $estuId)
                  ->when($nivelId, fn($sq) => $sq->orWhere('nivel_id', $nivelId))
                  ->when($gradoId, fn($sq) => $sq->orWhere('grado_id', $gradoId));
            })
            ->when($conceptoId, fn($q) => $q->where(fn($sq) => $sq->whereNull('concepto_id')->orWhere('concepto_id', $conceptoId)))
            ->when(!$conceptoId, fn($q) => $q->whereNull('concepto_id'))
            ->get();
    }

    public function existePago(int $estuId, string $mes, int $anio): bool
    {
        return Pago::where('estu_id', $estuId)->where('pag_mes', $mes)->where('pag_anual', $anio)->exists();
    }
}