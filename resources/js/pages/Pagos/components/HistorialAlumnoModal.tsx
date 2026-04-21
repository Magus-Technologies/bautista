import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Clock, FileText, AlertCircle, Tag, TrendingUp, Calendar } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import api from '@/lib/api';

interface Voucher {
    id: number;
    estado: 'pendiente' | 'validado' | 'rechazado';
    comentario: string | null;
    archivo: string | null;
    created_at: string | null;
}

interface PagoHistorial {
    pag_id: number;
    pag_mes: string;
    pag_anual: number;
    pag_monto: number;
    pag_nombre1: string | null;
    pag_otro1: number;
    pag_nombre2: string | null;
    pag_otro2: number;
    total: number;
    estatus: number;
    pag_fecha: string | null;
    observacion: string | null;
    vouchers: Voucher[];
}

interface DescuentoActivo {
    motivo: string;
    tipo: string;
    valor: number;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    observacion: string | null;
}

interface HistorialData {
    estudiante: { estu_id: number; nombre: string };
    resumen: { total_pagado: number; total_pendiente: number; meses_registrados: number };
    pagos: PagoHistorial[];
    descuentos_activos: DescuentoActivo[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    estuId: number | null;
}

const ESTADO_VOUCHER: Record<string, { label: string; cls: string }> = {
    pendiente: { label: 'En revisión', cls: 'bg-amber-100 text-amber-700' },
    validado:  { label: 'Validado',    cls: 'bg-emerald-100 text-emerald-700' },
    rechazado: { label: 'Rechazado',   cls: 'bg-red-100 text-red-700' },
};

const MOTIVO_LABEL: Record<string, string> = {
    hermanos: 'Hermanos',
    merito:   'Mérito',
    beca:     'Beca',
    otro:     'Otro',
};

export default function HistorialAlumnoModal({ open, onClose, estuId }: Props) {
    const [data, setData]         = useState<HistorialData | null>(null);
    const [loading, setLoading]   = useState(false);
    const [expanded, setExpanded] = useState<number | null>(null);

    useEffect(() => {
        if (!open || !estuId) return;
        setLoading(true);
        setData(null);
        setExpanded(null);
        api.get(`/pagos/historial/${estuId}`)
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [open, estuId]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">
                <DialogHeader className="px-5 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
                    <DialogTitle className="text-base font-black uppercase tracking-tight text-gray-900">
                        Historial de Pagos
                    </DialogTitle>
                    {data && (
                        <p className="text-xs text-gray-500 font-medium">{data.estudiante.nombre}</p>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {loading && (
                        <div className="py-16 text-center text-sm text-gray-400 animate-pulse">Cargando historial…</div>
                    )}

                    {!loading && data && (
                        <>
                            {/* Resumen */}
                            <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100">
                                <StatCard
                                    title="Total Pagado"
                                    value={`S/ ${data.resumen.total_pagado.toFixed(2)}`}
                                    icon={TrendingUp}
                                    color="text-emerald-600"
                                    iconBg="bg-emerald-500"
                                />
                                <StatCard
                                    title="Pendiente"
                                    value={`S/ ${data.resumen.total_pendiente.toFixed(2)}`}
                                    icon={Clock}
                                    color="text-amber-600"
                                    iconBg="bg-amber-500"
                                />
                                <StatCard
                                    title="Meses registrados"
                                    value={data.resumen.meses_registrados}
                                    icon={Calendar}
                                    color="text-gray-800"
                                    iconBg="bg-gray-500"
                                />
                            </div>

                            {/* Descuentos activos (Req 12.8) */}
                            {data.descuentos_activos.length > 0 && (
                                <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1">
                                        <Tag className="size-3" /> Descuentos activos
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {data.descuentos_activos.map((d, i) => (
                                            <div key={i} className="flex items-center gap-1.5 rounded-lg bg-white border border-indigo-100 px-2.5 py-1.5 text-xs">
                                                <span className="font-bold text-indigo-700">{MOTIVO_LABEL[d.motivo] ?? d.motivo}</span>
                                                <span className="text-gray-500">
                                                    {d.tipo === 'porcentaje' ? `${d.valor}%` : `S/ ${d.valor.toFixed(2)}`}
                                                </span>
                                                {d.fecha_fin && (
                                                    <span className="text-gray-400">hasta {d.fecha_fin}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Lista de pagos */}
                            {data.pagos.length === 0 ? (
                                <div className="py-12 text-center text-sm text-gray-400">
                                    <AlertCircle className="mx-auto mb-2 size-8 opacity-20" />
                                    Sin pagos registrados.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {data.pagos.map(p => (
                                        <div key={p.pag_id}>
                                            <button
                                                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                                                onClick={() => setExpanded(expanded === p.pag_id ? null : p.pag_id)}
                                            >
                                                <div className={`shrink-0 w-2 h-2 rounded-full ${p.estatus === 1 ? 'bg-emerald-400' : 'bg-amber-400'}`} />

                                                <div className="flex-1 min-w-0">
                                                    <span className="font-bold text-sm text-gray-800">{p.pag_mes} {p.pag_anual}</span>
                                                    {p.pag_fecha && (
                                                        <span className="ml-2 text-xs text-gray-400">{p.pag_fecha}</span>
                                                    )}
                                                    {/* Descuento aplicado badge */}
                                                    {p.observacion && (
                                                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-px font-bold">
                                                            <Tag className="size-2.5" /> Desc.
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <div className="font-bold text-gray-900 text-sm">S/ {p.total.toFixed(2)}</div>
                                                    <div className={`text-[10px] font-bold uppercase ${p.estatus === 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {p.estatus === 1 ? 'Pagado' : 'Pendiente'}
                                                    </div>
                                                </div>

                                                {p.vouchers.length > 0 && (
                                                    <div className="shrink-0 flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                                                        <FileText className="size-3" />
                                                        {p.vouchers.length}
                                                    </div>
                                                )}
                                            </button>

                                            {expanded === p.pag_id && (
                                                <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100 space-y-3">
                                                    {/* Conceptos */}
                                                    <div className="pt-3 space-y-1">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500">Mensualidad</span>
                                                            <span className="font-semibold">S/ {p.pag_monto.toFixed(2)}</span>
                                                        </div>
                                                        {p.pag_nombre1 && p.pag_otro1 > 0 && (
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-gray-500">{p.pag_nombre1}</span>
                                                                <span className="font-semibold">S/ {p.pag_otro1.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        {p.pag_nombre2 && p.pag_otro2 > 0 && (
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-gray-500">{p.pag_nombre2}</span>
                                                                <span className="font-semibold">S/ {p.pag_otro2.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between text-xs font-black border-t border-gray-200 pt-1 mt-1">
                                                            <span>Total</span>
                                                            <span>S/ {p.total.toFixed(2)}</span>
                                                        </div>

                                                        {/* Descuento aplicado (Req 12.8) */}
                                                        {p.observacion && (
                                                            <div className="flex items-start gap-1.5 rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-2 mt-1">
                                                                <Tag className="size-3 text-indigo-500 mt-px shrink-0" />
                                                                <span className="text-[10px] text-indigo-700 leading-relaxed">{p.observacion}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Vouchers */}
                                                    {p.vouchers.length > 0 && (
                                                        <div className="space-y-1.5">
                                                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Comprobantes</p>
                                                            {p.vouchers.map(v => (
                                                                <div key={v.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {v.estado === 'validado'
                                                                            ? <CheckCircle className="size-3.5 text-emerald-500" />
                                                                            : v.estado === 'rechazado'
                                                                            ? <AlertCircle className="size-3.5 text-red-500" />
                                                                            : <Clock className="size-3.5 text-amber-500" />
                                                                        }
                                                                        <span className="text-xs text-gray-600">{v.created_at}</span>
                                                                        {v.archivo && (
                                                                            <a
                                                                                href={`/storage/${v.archivo}`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="text-indigo-600 hover:text-indigo-800"
                                                                                title="Ver comprobante"
                                                                            >
                                                                                <FileText className="size-3.5" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {v.comentario && (
                                                                            <span className="text-xs text-gray-400 italic max-w-[120px] truncate" title={v.comentario}>{v.comentario}</span>
                                                                        )}
                                                                        <span className={`text-[10px] font-black rounded-full px-2 py-0.5 ${ESTADO_VOUCHER[v.estado]?.cls ?? ''}`}>
                                                                            {ESTADO_VOUCHER[v.estado]?.label ?? v.estado}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
