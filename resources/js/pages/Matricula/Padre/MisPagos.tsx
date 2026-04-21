import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, FileText, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import SectionCard from '@/components/shared/SectionCard';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Portal Familia', href: '/padre/dashboard' },
    { title: 'Mis Pagos', href: '#' },
];

export default function MisPagosPage() {
    const [hijos, setHijos] = useState<any[]>([]);
    const [pagos, setPagos] = useState<any[]>([]);
    const [hijoSel, setHijoSel] = useState<number | 'todos'>('todos');
    const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    const aniosDisponibles = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    useEffect(() => {
        const load = async () => {
            try {
                const hijosRes = await api.get('/padre/hijos');
                const hijosData = hijosRes.data || [];
                setHijos(hijosData);

                const pagosAll: any[] = [];
                for (const hijo of hijosData) {
                    const res = await api.get(`/padre/hijo/${hijo.estu_id}/resumen`);
                    (res.data.pagos || []).forEach((p: any) => {
                        pagosAll.push({ ...p, hijo_nombre: hijo.perfil?.primer_nombre, estu_id: hijo.estu_id });
                    });
                }
                setPagos(pagosAll);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const pagosFiltrados = pagos.filter(p =>
        (hijoSel === 'todos' || p.estu_id === hijoSel) &&
        Number(p.pag_anual) === anioFiltro
    );

    const totalPagado  = pagosFiltrados.filter(p => p.estatus == 1).reduce((sum, p) => sum + parseFloat(p.total ?? p.pag_monto ?? 0), 0);
    const totalPendientes = pagosFiltrados.filter(p => p.estatus != 1).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mis Pagos" />
            <div className="space-y-6 p-4 sm:p-6">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <PageHeader
                        icon={CreditCard}
                        title="Mis Pagos"
                        subtitle="Historial de pagos de tus hijos"
                        iconColor="bg-indigo-600"
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Filtro año */}
                        <select
                            value={anioFiltro}
                            onChange={e => setAnioFiltro(Number(e.target.value))}
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-700"
                        >
                            {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>

                        {/* Filtro por hijo */}
                        {hijos.length > 1 && (
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                                <button onClick={() => setHijoSel('todos')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${hijoSel === 'todos' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                                    Todos
                                </button>
                                {hijos.map(h => (
                                    <button key={h.estu_id} onClick={() => setHijoSel(h.estu_id)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${hijoSel === h.estu_id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                                        {h.perfil?.primer_nombre}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        title="Total Pagado"
                        value={`S/ ${totalPagado.toFixed(2)}`}
                        icon={TrendingUp}
                        color="text-indigo-600"
                        iconBg="bg-indigo-500"
                    />
                    <StatCard
                        title="Registros"
                        value={pagosFiltrados.length}
                        icon={FileText}
                        color="text-gray-700"
                        iconBg="bg-gray-500"
                    />
                    <StatCard
                        title="Pendientes"
                        value={totalPendientes}
                        icon={AlertCircle}
                        color={totalPendientes > 0 ? 'text-amber-600' : 'text-emerald-600'}
                        iconBg={totalPendientes > 0 ? 'bg-amber-500' : 'bg-emerald-500'}
                    />
                </div>

                {/* Tabla */}
                <SectionCard title="Historial de Pagos">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="size-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                    ) : pagosFiltrados.length === 0 ? (
                        <div className="py-12 text-center text-sm text-gray-400 font-medium">
                            No hay pagos registrados.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {hijoSel === 'todos' && <th className="pb-3 pr-4">Alumno</th>}
                                        <th className="pb-3 pr-4">Concepto</th>
                                        <th className="pb-3 pr-4 text-right">Monto</th>
                                        <th className="pb-3 pr-4 text-center hidden sm:table-cell">Estado</th>
                                        <th className="pb-3 pr-4 text-right hidden sm:table-cell">Fecha</th>
                                        <th className="pb-3 text-center">Comprobante</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pagosFiltrados.map((p: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            {hijoSel === 'todos' && (
                                                <td className="py-3 pr-4 text-xs text-gray-500 font-medium">{p.hijo_nombre}</td>
                                            )}
                                            <td className="py-3 pr-4">
                                                <p className="font-medium text-gray-800">{p.pag_nombre1 || 'Mensualidad'}</p>
                                                {p.pag_mes && <p className="text-xs text-gray-400">{p.pag_mes}</p>}
                                                {p.observacion && (
                                                    <p className="text-[10px] text-indigo-600 mt-0.5 max-w-[200px] truncate" title={p.observacion}>
                                                        🏷 {p.observacion}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-3 pr-4 text-right font-semibold text-gray-900">
                                                S/ {parseFloat(p.total ?? p.pag_monto ?? 0).toFixed(2)}
                                            </td>
                                            <td className="py-3 pr-4 text-center hidden sm:table-cell">
                                                {p.estatus == 1 ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                        Pagado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 pr-4 text-right text-xs text-gray-400 hidden sm:table-cell">
                                                {p.pag_fecha}
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    {p.ultimo_voucher ? (() => {
                                                        const v = p.ultimo_voucher;
                                                        const cfg: Record<string, { label: string; cls: string }> = {
                                                            pendiente: { label: 'En revisión', cls: 'bg-amber-100 text-amber-700' },
                                                            validado:  { label: 'Validado',    cls: 'bg-emerald-100 text-emerald-700' },
                                                            rechazado: { label: 'Rechazado',   cls: 'bg-red-100 text-red-700' },
                                                        };
                                                        const c = cfg[v.estado] ?? { label: v.estado, cls: 'bg-gray-100 text-gray-600' };
                                                        return (
                                                            <div className="flex flex-col items-center gap-0.5">
                                                                <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap ${c.cls}`}>
                                                                    {c.label}
                                                                </span>
                                                                {v.estado === 'rechazado' && v.comentario && (
                                                                    <span className="text-[10px] text-red-500 italic max-w-[110px] truncate" title={v.comentario}>
                                                                        {v.comentario}
                                                                    </span>
                                                                )}
                                                                {v.archivo_url && (
                                                                    <a 
                                                                        href={v.archivo_url} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="mt-1 flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                                                        title="Descargar Comprobante"
                                                                    >
                                                                        <Download size={12} /> Ver Recibo
                                                                    </a>
                                                                )}
                                                            </div>
                                                        );
                                                    })() : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>
            </div>

        </AppLayout>
    );
}
