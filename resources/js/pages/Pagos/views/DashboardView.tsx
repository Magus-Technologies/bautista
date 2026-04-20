import { useState, useEffect, useCallback } from 'react';
import {
    BarChart2, AlertTriangle, Clock, TrendingUp,
    CheckCircle, Zap, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

const MESES = [
    'ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
    'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE',
];

interface DashboardStats {
    total_recaudado: number;
    total_pendientes: number;
    vouchers_pendientes: number;
    porcentaje_cobranza: number;
    total_registros: number;
}

interface Vencido {
    pag_id: number;
    estu_id: number;
    alumno: string;
    pag_mes: string;
    pag_anual: number;
    total: number;
    dias_vencimiento: number;
}

export default function DashboardView() {
    const now = new Date();
    const [mes, setMes]   = useState(MESES[now.getMonth()]);
    const [anio, setAnio] = useState(now.getFullYear());

    const [stats, setStats]       = useState<DashboardStats | null>(null);
    const [vencidos, setVencidos] = useState<Vencido[]>([]);
    const [loading, setLoading]   = useState(true);
    const [showVencidos, setShowVencidos] = useState(false);

    const [generando, setGenerando]     = useState(false);
    const [genResult, setGenResult]     = useState<{ creados: number; omitidos: number } | null>(null);
    const [confirmando, setConfirmando] = useState(false);

    const anios = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, vencRes] = await Promise.all([
                api.get('/pagos/dashboard', { params: { mes, anio } }),
                api.get('/pagos/vencidos'),
            ]);
            setStats(dashRes.data);
            setVencidos(vencRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [mes, anio]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const generarMensualidades = async () => {
        setGenerando(true);
        setGenResult(null);
        try {
            const r = await api.post('/pagos/generar-mensualidades', { mes, anio });
            setGenResult(r.data);
            fetchStats();
        } catch (e) {
            console.error(e);
        } finally {
            setGenerando(false);
            setConfirmando(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filtros período */}
            <div className="flex items-center gap-2 flex-wrap">
                <select value={mes} onChange={e => setMes(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={anio} onChange={e => setAnio(Number(e.target.value))}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    {anios.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <Button size="sm" variant="outline" onClick={fetchStats} disabled={loading} className="h-9">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-white/20 rounded-xl p-2.5"><TrendingUp className="size-5 sm:size-6" /></div>
                        <BarChart2 className="size-4 opacity-50" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black">
                        {loading ? '—' : `S/ ${stats?.total_recaudado.toFixed(2) ?? '0.00'}`}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider opacity-80 mt-1">Recaudado</div>
                    <div className="text-xs opacity-60">{mes} {anio}</div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-white/20 rounded-xl p-2.5"><Clock className="size-5 sm:size-6" /></div>
                        {!loading && vencidos.length > 0 && (
                            <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 font-bold">{vencidos.length} venc.</span>
                        )}
                    </div>
                    <div className="text-2xl sm:text-3xl font-black">
                        {loading ? '—' : stats?.total_pendientes ?? 0}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider opacity-80 mt-1">Pendientes</div>
                    <div className="text-xs opacity-60">{mes} {anio}</div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-white/20 rounded-xl p-2.5"><CheckCircle className="size-5 sm:size-6" /></div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black">
                        {loading ? '—' : stats?.vouchers_pendientes ?? 0}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider opacity-80 mt-1">Vouchers en revisión</div>
                    <div className="text-xs opacity-60">Pendientes de validar</div>
                </div>

                <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-white/20 rounded-xl p-2.5"><TrendingUp className="size-5 sm:size-6" /></div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black">
                        {loading ? '—' : `${stats?.porcentaje_cobranza ?? 0}%`}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider opacity-80 mt-1">Cobranza</div>
                    <div className="text-xs opacity-60">
                        {!loading && stats && `${stats.total_registros} registros`}
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Generar mensualidades */}
                <div className="flex-1 rounded-2xl border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-green-600 p-2.5 text-white shrink-0">
                            <Zap className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-green-900 text-sm uppercase tracking-tight">
                                Generar Mensualidades
                            </h3>
                            <p className="text-xs text-green-700 mt-0.5">
                                Crea pagos pendientes para todos los alumnos con contacto pagador activo en {mes} {anio}.
                            </p>
                            {genResult && (
                                <div className="mt-2 text-xs font-bold text-green-800 bg-green-100 rounded-lg px-3 py-1.5">
                                    ✓ {genResult.creados} creados · {genResult.omitidos} omitidos (ya existían)
                                </div>
                            )}
                        </div>
                        <div className="shrink-0">
                            {confirmando ? (
                                <div className="flex flex-col gap-1.5 items-end">
                                    <p className="text-xs font-bold text-green-800">¿Confirmar?</p>
                                    <div className="flex gap-1.5">
                                        <Button size="sm"
                                            className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs px-3"
                                            onClick={generarMensualidades} disabled={generando}>
                                            {generando ? 'Generando…' : 'Sí, generar'}
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-7 text-xs px-3"
                                            onClick={() => setConfirmando(false)} disabled={generando}>
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white h-8 px-4 text-xs font-bold"
                                    onClick={() => setConfirmando(true)}>
                                    <Zap className="h-3.5 w-3.5 mr-1" />
                                    Generar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Alertas vencidos */}
                {vencidos.length > 0 && (
                    <div className="flex-1 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <button className="w-full flex items-start gap-3 text-left"
                            onClick={() => setShowVencidos(v => !v)}>
                            <div className="rounded-xl bg-red-500 p-2.5 text-white shrink-0">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-red-900 text-sm uppercase tracking-tight">
                                    {vencidos.length} Pago{vencidos.length !== 1 ? 's' : ''} Vencido{vencidos.length !== 1 ? 's' : ''}
                                </h3>
                                <p className="text-xs text-red-700 mt-0.5">Con más de 30 días sin pagar.</p>
                            </div>
                            {showVencidos
                                ? <ChevronUp className="size-4 text-red-500 shrink-0 mt-1" />
                                : <ChevronDown className="size-4 text-red-500 shrink-0 mt-1" />
                            }
                        </button>

                        {showVencidos && (
                            <div className="mt-3 space-y-1.5 max-h-52 overflow-y-auto">
                                {vencidos.map(v => (
                                    <div key={v.pag_id} className="flex items-center justify-between rounded-lg bg-white border border-red-100 px-3 py-2">
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">{v.alumno || `Est. #${v.estu_id}`}</p>
                                            <p className="text-[10px] text-gray-500">{v.pag_mes} {v.pag_anual}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-700">S/ {Number(v.total).toFixed(2)}</p>
                                            <p className="text-[10px] font-bold text-red-600">{v.dias_vencimiento}d vencido</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
