import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, FileText, AlertCircle, Download, Calendar, Wallet } from 'lucide-react';
import api from '@/lib/api';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import PageTabs from '@/components/shared/PageTabs';
import ResourceTable, { type Column, type Paginated } from '@/components/shared/ResourceTable';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Portal Familia', href: '/padre/dashboard' },
    { title: 'Mis Pagos', href: '#' },
];

export default function MisPagosPage() {
    const [hijos, setHijos]         = useState<any[]>([]);
    const [pagos, setPagos]         = useState<any[]>([]);
    const [hijoSel, setHijoSel]     = useState<number | 'todos'>('todos');
    const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());
    const [loading, setLoading]     = useState(true);

    const aniosDisponibles = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    useEffect(() => {
        const load = async () => {
            try {
                const hijosRes  = await api.get('/padre/hijos');
                const hijosData = hijosRes.data || [];
                setHijos(hijosData);

                const pagosAll: any[] = [];
                for (const hijo of hijosData) {
                    const res = await api.get(`/padre/hijo/${hijo.estu_id}/resumen`);
                    (res.data.pagos || []).forEach((p: any) => {
                        pagosAll.push({ 
                            ...p, 
                            hijo_nombre: `${hijo.perfil?.primer_nombre || ''} ${hijo.perfil?.apellido_paterno || ''}`.trim(),
                            estu_id: hijo.estu_id,
                            periodicidad: p.pag_mes ? 'mensual' : 'unico'
                        });
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

    const pagosMensuales = pagosFiltrados.filter(p => p.periodicidad === 'mensual');
    const pagosUnicos = pagosFiltrados.filter(p => p.periodicidad === 'unico');

    const totalPagado     = pagosFiltrados.filter(p => p.estatus == 1).reduce((sum, p) => sum + parseFloat(p.total ?? p.pag_monto ?? 0), 0);
    const totalPendientes = pagosFiltrados.filter(p => p.estatus != 1).length;

    // Función para generar columnas
    const getColumns = (incluirMes: boolean): Column<any>[] => [
        {
            label: '#',
            className: 'text-center w-12',
            render: (_: any, index: number) => (
                <span className="text-gray-400 font-mono text-xs">{index + 1}</span>
            ),
        },
        ...(hijoSel === 'todos' ? [{
            label: 'Alumno',
            render: (p: any) => <span className="text-xs text-gray-700 font-medium">{p.hijo_nombre}</span>,
        }] : []),
        {
            label: 'Concepto',
            render: (p: any) => (
                <div className="text-left">
                    <p className="font-medium text-gray-800">
                        {p.pag_nombre1 || p.concepto_nombre || 'Pago'}
                    </p>
                    {p.observacion && (
                        <p className="text-[10px] text-indigo-600 mt-0.5 max-w-[200px] truncate" title={p.observacion}>
                            🏷 {p.observacion}
                        </p>
                    )}
                </div>
            ),
        },
        ...(incluirMes ? [{
            label: 'Mes',
            render: (p: any) => p.pag_mes ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {p.pag_mes}
                </span>
            ) : <span className="text-xs text-gray-400">-</span>,
        }] : []),
        {
            label: 'Monto',
            className: 'text-right',
            render: (p: any) => (
                <span className="font-bold text-blue-600">
                    S/ {parseFloat(p.total ?? p.pag_monto ?? 0).toFixed(2)}
                </span>
            ),
        },
        {
            label: 'Estado',
            render: (p: any) => p.estatus == 1 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    PAGADO
                </span>
            ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    PENDIENTE
                </span>
            ),
        },
        {
            label: 'Fecha',
            render: (p: any) => <span className="text-xs text-gray-500">{p.pag_fecha ?? '-'}</span>,
        },
        {
            label: 'Comprobante',
            className: 'text-center',
            render: (p: any) => {
                // Si tiene comprobante electrónico
                if (p.comprobante_id) {
                    return (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                            Emitido
                        </span>
                    );
                }

                // Si tiene voucher (recibo subido)
                const v = p.ultimo_voucher;
                if (!v) return <span className="text-xs text-gray-400">-</span>;
                
                const cfg: Record<string, { label: string; cls: string }> = {
                    pendiente: { label: 'En revisión', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
                    validado:  { label: 'Validado',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                    rechazado: { label: 'Rechazado',   cls: 'bg-red-100 text-red-700 border-red-200' },
                };
                const c = cfg[v.estado] ?? { label: v.estado, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
                
                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap border ${c.cls}`}>
                            {c.label}
                        </span>
                        {v.estado === 'rechazado' && v.comentario && (
                            <span className="text-[10px] text-red-500 italic max-w-[110px] truncate" title={v.comentario}>
                                {v.comentario}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            label: 'Acciones',
            className: 'text-center',
            render: (p: any) => {
                // Si tiene comprobante electrónico
                if (p.comprobante_id) {
                    return (
                        <button
                            onClick={async () => {
                                try {
                                    const { data } = await api.post(`/comprobantes/${p.comprobante_id}/pdf-token`);
                                    window.open(`/comprobantes/${p.comprobante_id}/pdf?token=${data.token}`, '_blank');
                                } catch (error) {
                                    console.error('Error generando token:', error);
                                    alert('Error al abrir el comprobante');
                                }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-bold"
                            title="Ver Comprobante"
                        >
                            <Download size={14} /> Ver PDF
                        </button>
                    );
                }

                // Si tiene voucher con archivo
                const v = p.ultimo_voucher;
                if (v?.archivo_url) {
                    return (
                        <a
                            href={v.archivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-xs font-bold"
                            title="Descargar Recibo"
                        >
                            <Download size={14} /> Ver Recibo
                        </a>
                    );
                }

                return <span className="text-xs text-gray-400">-</span>;
            },
        },
    ];

    // Adaptar array plano al formato Paginated
    const wrapAsPaginated = (data: any[]): Paginated<any> => ({
        data,
        current_page: 1,
        last_page:    1,
        per_page:     data.length,
        total:        data.length,
        from:         1,
        to:           data.length,
    });

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

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Filtro año */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-600">Año:</label>
                            <select
                                value={anioFiltro}
                                onChange={e => setAnioFiltro(Number(e.target.value))}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>

                        {/* Filtro por hijo - Siempre visible si hay hijos */}
                        {hijos.length > 0 && (
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-gray-600">Alumno:</label>
                                <select
                                    value={hijoSel}
                                    onChange={e => setHijoSel(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
                                >
                                    {hijos.length > 1 && <option value="todos">Todos los hijos</option>}
                                    {hijos.map(h => (
                                        <option key={h.estu_id} value={h.estu_id}>
                                            {h.perfil?.primer_nombre} {h.perfil?.apellido_paterno}
                                        </option>
                                    ))}
                                </select>
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

                {/* Tabs con tablas separadas */}
                {loading ? (
                    <div className="flex justify-center py-12 bg-white rounded-2xl border border-gray-100">
                        <div className="size-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    <PageTabs
                        defaultValue="mensualidades"
                        tabs={[
                            {
                                value: 'mensualidades',
                                label: `Mensualidades (${pagosMensuales.length})`,
                                icon: Calendar,
                                content: (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        {pagosMensuales.length === 0 ? (
                                            <div className="py-12 text-center text-sm text-gray-400 font-medium">
                                                No hay mensualidades registradas.
                                            </div>
                                        ) : (
                                            <ResourceTable
                                                rows={wrapAsPaginated(pagosMensuales)}
                                                columns={getColumns(true)}
                                                getKey={(p: any) => `${p.estu_id}-${p.pag_id || p.pag_fecha}`}
                                            />
                                        )}
                                    </div>
                                )
                            },
                            {
                                value: 'unicos',
                                label: `Pagos Únicos (${pagosUnicos.length})`,
                                icon: Wallet,
                                content: (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        {pagosUnicos.length === 0 ? (
                                            <div className="py-12 text-center text-sm text-gray-400 font-medium">
                                                No hay pagos únicos registrados.
                                            </div>
                                        ) : (
                                            <ResourceTable
                                                rows={wrapAsPaginated(pagosUnicos)}
                                                columns={getColumns(false)}
                                                getKey={(p: any) => `${p.estu_id}-${p.pag_id || p.pag_fecha}`}
                                            />
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />
                )}
            </div>
        </AppLayout>
    );
}
