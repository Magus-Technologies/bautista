import { useState, useEffect, useCallback } from 'react';
import { BarChart2, RefreshCw, TrendingUp, FileDown, DollarSign, Clock, Sheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionCard from '@/components/shared/SectionCard';
import StatCard from '@/components/shared/StatCard';
import PageTabs from '@/components/shared/PageTabs';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import api from '@/lib/api';

const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
               'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

interface FilaReporte {
    nivel_id: number;
    nombre_nivel: string;
    grado_id: number;
    nombre_grado: string;
    total_pagos: number;
    pagos_realizados: number;
    pagos_pendientes: number;
    monto_recaudado: number;
    monto_pendiente: number;
    porcentaje_cobranza: number;
}

function toPaginated<T>(data: T[]) {
    return { data, current_page: 1, last_page: 1, per_page: data.length, total: data.length, from: 1, to: data.length };
}

const gradoColumns: Column<FilaReporte>[] = [
    {
        label: 'Grado',
        render: f => <span className="font-semibold text-gray-800 text-xs">{f.nombre_grado}</span>,
    },
    {
        label: 'Pagos',
        className: 'hidden sm:table-cell',
        render: f => <span className="text-xs text-gray-600">{f.total_pagos}</span>,
    },
    {
        label: 'Pagados',
        className: 'hidden sm:table-cell',
        render: f => <span className="text-xs text-emerald-600 font-bold">{f.pagos_realizados}</span>,
    },
    {
        label: 'Pend.',
        className: 'hidden sm:table-cell',
        render: f => <span className="text-xs text-amber-600 font-bold">{f.pagos_pendientes}</span>,
    },
    {
        label: 'Recaudado',
        render: f => <span className="text-xs font-bold text-emerald-700">S/ {Number(f.monto_recaudado).toFixed(2)}</span>,
    },
    {
        label: 'Pendiente',
        className: 'hidden sm:table-cell',
        render: f => <span className="text-xs font-bold text-amber-700">S/ {Number(f.monto_pendiente).toFixed(2)}</span>,
    },
    {
        label: '%',
        render: f => (
            <div className="inline-flex items-center gap-1">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
                    <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${f.porcentaje_cobranza}%` }}
                    />
                </div>
                <span className={`text-xs font-black ${f.porcentaje_cobranza >= 80 ? 'text-emerald-600' : f.porcentaje_cobranza >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {f.porcentaje_cobranza}%
                </span>
            </div>
        ),
    },
];

export default function ReporteConsolidado() {
    const now = new Date();
    const [mes, setMes]     = useState(MESES[now.getMonth()]);
    const [anio, setAnio]   = useState(now.getFullYear());
    const [rows, setRows]   = useState<FilaReporte[]>([]);
    const [loading, setLoading]         = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloadingExcel, setDownloadingExcel] = useState(false);

    const anios = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i);

    const descargarPdf = async () => {
        setDownloading(true);
        try {
            const res = await api.get('/pagos/reporte-consolidado/pdf', {
                params: { mes, anio },
                responseType: 'blob',
            });
            const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href     = url;
            link.download = `Reporte_Consolidado_${mes}_${anio}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
        } finally {
            setDownloading(false);
        }
    };

    const descargarExcel = async () => {
        setDownloadingExcel(true);
        try {
            const res = await api.get('/pagos/reporte-consolidado/excel', {
                params: { mes, anio },
                responseType: 'blob',
            });
            const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
            const link = document.createElement('a');
            link.href     = url;
            link.download = `Reporte_Consolidado_${mes}_${anio}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
        } finally {
            setDownloadingExcel(false);
        }
    };

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/pagos/reporte-consolidado', { params: { mes, anio } });
            setRows(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [mes, anio]);

    useEffect(() => { cargar(); }, [cargar]);

    const totalRecaudado = rows.reduce((s, r) => s + Number(r.monto_recaudado), 0);
    const totalPendiente = rows.reduce((s, r) => s + Number(r.monto_pendiente), 0);
    const totalPagos     = rows.reduce((s, r) => s + r.total_pagos, 0);
    const pctGlobal      = totalPagos > 0
        ? Math.round(rows.reduce((s, r) => s + r.pagos_realizados, 0) / totalPagos * 1000) / 10
        : 0;

    // Group by nivel
    const byNivel = rows.reduce<Record<string, FilaReporte[]>>((acc, r) => {
        const key = `${r.nivel_id}-${r.nombre_nivel}`;
        (acc[key] ??= []).push(r);
        return acc;
    }, {});

    const nivelKeys = Object.keys(byNivel);

    const tabs = nivelKeys.map(key => {
        const filas = byNivel[key];
        const nivelNombre = filas[0].nombre_nivel;
        const nivelRec    = filas.reduce((s, r) => s + Number(r.monto_recaudado), 0);
        const nivelPend   = filas.reduce((s, r) => s + Number(r.monto_pendiente), 0);
        const pct = filas.reduce((s, r) => s + r.pagos_realizados, 0) /
                    Math.max(filas.reduce((s, r) => s + r.total_pagos, 0), 1) * 100;

        return {
            value: key,
            label: `${nivelNombre} ${Math.round(pct)}%`,
            content: (
                <div>
                    {/* Nivel summary bar */}
                    <div className="flex items-center justify-between bg-gray-800 text-white rounded-t-xl px-4 py-2">
                        <span className="text-xs font-black uppercase tracking-widest">{nivelNombre}</span>
                        <div className="flex gap-4 text-xs">
                            <span className="text-emerald-300 font-bold">S/ {nivelRec.toFixed(2)} rec.</span>
                            <span className="text-amber-300 font-bold">S/ {nivelPend.toFixed(2)} pend.</span>
                        </div>
                    </div>
                    <div className="border border-t-0 border-gray-100 rounded-b-xl overflow-hidden">
                        <ResourceTable
                            rows={toPaginated(filas)}
                            columns={gradoColumns}
                            getKey={f => f.grado_id}
                        />
                    </div>
                </div>
            ),
        };
    });

    return (
        <SectionCard
            title="Reporte Consolidado por Nivel / Grado"
            action={
                <div className="flex items-center gap-2">
                    <select value={mes} onChange={e => setMes(e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs">
                        {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={anio} onChange={e => setAnio(Number(e.target.value))}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs">
                        {anios.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <Button size="sm" variant="outline" onClick={cargar} disabled={loading} className="h-7 w-7 p-0">
                        <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={descargarExcel}
                        disabled={downloadingExcel || rows.length === 0}
                        className="h-7 w-7 p-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        title="Descargar Excel"
                    >
                        <Sheet className={`size-3.5 ${downloadingExcel ? 'animate-pulse' : ''}`} />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={descargarPdf}
                        disabled={downloading || rows.length === 0}
                        className="h-7 w-7 p-0 text-red-600 border-red-200 hover:bg-red-50"
                        title="Descargar PDF"
                    >
                        <FileDown className={`size-3.5 ${downloading ? 'animate-pulse' : ''}`} />
                    </Button>
                </div>
            }
        >
            {/* Totales globales */}
            {rows.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <StatCard
                        title="Recaudado"
                        value={`S/ ${totalRecaudado.toFixed(2)}`}
                        icon={TrendingUp}
                        color="text-emerald-600"
                        iconBg="bg-emerald-500"
                    />
                    <StatCard
                        title="Pendiente"
                        value={`S/ ${totalPendiente.toFixed(2)}`}
                        icon={Clock}
                        color="text-amber-600"
                        iconBg="bg-amber-500"
                    />
                    <StatCard
                        title="Total pagos"
                        value={totalPagos}
                        icon={BarChart2}
                        color="text-gray-800"
                        iconBg="bg-gray-500"
                    />
                    <StatCard
                        title="% Global"
                        value={`${pctGlobal}%`}
                        icon={DollarSign}
                        color="text-sky-600"
                        iconBg="bg-sky-500"
                    />
                </div>
            )}

            {loading ? (
                <p className="py-8 text-center text-sm text-gray-400 animate-pulse">Cargando reporte…</p>
            ) : rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Sin datos para {mes} {anio}.</p>
            ) : (
                <PageTabs tabs={tabs} defaultValue={nivelKeys[0]} />
            )}
        </SectionCard>
    );
}
