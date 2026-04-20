import { useState, useEffect, useCallback } from 'react';
import { BarChart2, RefreshCw, TrendingUp, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SectionCard from '@/components/shared/SectionCard';
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

export default function ReporteConsolidado() {
    const now = new Date();
    const [mes, setMes]     = useState(MESES[now.getMonth()]);
    const [anio, setAnio]   = useState(now.getFullYear());
    const [rows, setRows]   = useState<FilaReporte[]>([]);
    const [loading, setLoading]         = useState(false);
    const [downloading, setDownloading] = useState(false);

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

    const fetch = useCallback(async () => {
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

    useEffect(() => { fetch(); }, [fetch]);

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
                    <Button size="sm" variant="outline" onClick={fetch} disabled={loading} className="h-7 w-7 p-0">
                        <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={descargarPdf} disabled={downloading || rows.length === 0} className="h-7 px-2 gap-1 text-xs">
                        <FileDown className={`size-3.5 ${downloading ? 'animate-pulse' : ''}`} />
                        PDF
                    </Button>
                </div>
            }
        >
            {/* Totales globales */}
            {rows.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                        { label: 'Recaudado',   value: `S/ ${totalRecaudado.toFixed(2)}`, color: 'text-emerald-600', icon: TrendingUp },
                        { label: 'Pendiente',   value: `S/ ${totalPendiente.toFixed(2)}`, color: 'text-amber-600',   icon: BarChart2 },
                        { label: 'Total pagos', value: totalPagos,                         color: 'text-gray-800',    icon: BarChart2 },
                        { label: '% Global',    value: `${pctGlobal}%`,                   color: 'text-sky-600',     icon: TrendingUp },
                    ].map(s => (
                        <div key={s.label} className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-center">
                            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <p className="py-8 text-center text-sm text-gray-400 animate-pulse">Cargando reporte…</p>
            ) : rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Sin datos para {mes} {anio}.</p>
            ) : (
                <Tabs defaultValue={nivelKeys[0]}>
                    {/* Tab triggers */}
                    <TabsList className="mb-4 flex flex-wrap gap-1 h-auto bg-gray-100 p-1 rounded-xl">
                        {nivelKeys.map(key => {
                            const filas = byNivel[key];
                            const nivelNombre = filas[0].nombre_nivel;
                            const pct = filas.reduce((s, r) => s + r.pagos_realizados, 0) /
                                        Math.max(filas.reduce((s, r) => s + r.total_pagos, 0), 1) * 100;
                            return (
                                <TabsTrigger key={key} value={key}
                                    className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow">
                                    <span>{nivelNombre}</span>
                                    <span className={`ml-2 text-[10px] font-black ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {Math.round(pct)}%
                                    </span>
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {/* Tab panels */}
                    {nivelKeys.map(key => {
                        const filas = byNivel[key];
                        const nivelRec  = filas.reduce((s, r) => s + Number(r.monto_recaudado), 0);
                        const nivelPend = filas.reduce((s, r) => s + Number(r.monto_pendiente), 0);

                        return (
                            <TabsContent key={key} value={key} className="mt-0">
                                {/* Nivel summary bar */}
                                <div className="flex items-center justify-between bg-gray-800 text-white rounded-t-xl px-4 py-2">
                                    <span className="text-xs font-black uppercase tracking-widest">{filas[0].nombre_nivel}</span>
                                    <div className="flex gap-4 text-xs">
                                        <span className="text-emerald-300 font-bold">S/ {nivelRec.toFixed(2)} rec.</span>
                                        <span className="text-amber-300 font-bold">S/ {nivelPend.toFixed(2)} pend.</span>
                                    </div>
                                </div>

                                {/* Grados table */}
                                <div className="border border-t-0 border-gray-100 rounded-b-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                                                <th className="py-2 pl-4 text-left">Grado</th>
                                                <th className="py-2 text-center hidden sm:table-cell">Pagos</th>
                                                <th className="py-2 text-center hidden sm:table-cell">Pagados</th>
                                                <th className="py-2 text-center hidden sm:table-cell">Pend.</th>
                                                <th className="py-2 text-right">Recaudado</th>
                                                <th className="py-2 text-right hidden sm:table-cell">Pendiente</th>
                                                <th className="py-2 pr-4 text-right">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filas.map(f => (
                                                <tr key={f.grado_id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-2.5 pl-4 font-semibold text-gray-800 text-xs">{f.nombre_grado}</td>
                                                    <td className="py-2.5 text-center text-xs text-gray-600 hidden sm:table-cell">{f.total_pagos}</td>
                                                    <td className="py-2.5 text-center text-xs text-emerald-600 font-bold hidden sm:table-cell">{f.pagos_realizados}</td>
                                                    <td className="py-2.5 text-center text-xs text-amber-600 font-bold hidden sm:table-cell">{f.pagos_pendientes}</td>
                                                    <td className="py-2.5 text-right text-xs font-bold text-emerald-700">
                                                        S/ {Number(f.monto_recaudado).toFixed(2)}
                                                    </td>
                                                    <td className="py-2.5 text-right text-xs font-bold text-amber-700 hidden sm:table-cell">
                                                        S/ {Number(f.monto_pendiente).toFixed(2)}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right">
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
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            )}
        </SectionCard>
    );
}
