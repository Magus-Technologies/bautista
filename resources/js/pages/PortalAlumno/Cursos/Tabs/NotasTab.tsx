import { useState, useEffect } from 'react';
import {
    FileText, Upload, CheckCircle2, Clock,
    Loader2, AlertCircle, ChevronDown, ChevronUp,
    BarChart2, BookOpen, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import StatCard from '@/components/shared/StatCard';
import api from '@/lib/api';

interface NotasTabProps {
    cursoId: number;
}

interface Actividad {
    actividad_id: number;
    nombre_actividad: string;
    nombre?: string;
    tipoActividad?: { nombre: string };
    tipo_actividad?: { nombre: string };
    id_tipo_actividad?: number;
    nota?: string | null;
    entregado?: boolean;
    fecha_entrega?: string | null;
    fecha_cierre?: string | null;
    clase_titulo?: string;
}

interface Clase {
    clase_id: number;
    titulo: string;
    actividades: Actividad[];
}

interface Unidad {
    unidad_id: number;
    titulo: string;
    clases: Clase[];
}

function getNoteColor(nota: string | null | undefined) {
    if (!nota) return 'text-gray-300';
    const n = parseFloat(nota);
    if (n >= 14) return 'text-emerald-600';
    if (n >= 11) return 'text-amber-500';
    return 'text-rose-600';
}

function getNoteRing(nota: string | null | undefined) {
    if (!nota) return 'ring-gray-100 bg-gray-50';
    const n = parseFloat(nota);
    if (n >= 14) return 'ring-emerald-100 bg-emerald-50';
    if (n >= 11) return 'ring-amber-100 bg-amber-50';
    return 'ring-rose-100 bg-rose-50';
}

function UploadResult({ ok, msg }: { ok: boolean; msg: string }) {
    return (
        <div className={`flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-full ${
            ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}>
            {ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {msg}
        </div>
    );
}

export default function NotasTab({ cursoId }: NotasTabProps) {
    const [data, setData]           = useState<{ unidades: Unidad[] } | null>(null);
    const [loading, setLoading]     = useState(true);
    const [uploading, setUploading] = useState<number | null>(null);
    const [feedback, setFeedback]   = useState<Record<number, { ok: boolean; msg: string }>>({});
    const [openUnits, setOpenUnits] = useState<Set<number>>(new Set());

    useEffect(() => { loadData(); }, [cursoId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/alumno/curso/${cursoId}`);
            setData(res.data);
            // open all units by default
            const ids = (res.data.unidades as Unidad[]).map((u) => u.unidad_id);
            setOpenUnits(new Set(ids));
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (actividadId: number, file: File) => {
        setUploading(actividadId);
        const form = new FormData();
        form.append('archivo', file);
        try {
            await api.post(`/alumno/actividad/${actividadId}/entregar`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setFeedback((p) => ({ ...p, [actividadId]: { ok: true, msg: 'Entregado con éxito' } }));
            loadData();
        } catch {
            setFeedback((p) => ({ ...p, [actividadId]: { ok: false, msg: 'Error al subir el archivo' } }));
        } finally {
            setUploading(null);
        }
    };

    const toggleUnit = (id: number) =>
        setOpenUnits((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">
                    Cargando historial...
                </p>
            </div>
        );
    }

    const unidades: Unidad[] = data?.unidades ?? [];

    // Flatten all activities for stats
    const actividades: Actividad[] = unidades.flatMap((u) =>
        u.clases.flatMap((c) =>
            c.actividades.map((a) => ({ ...a, clase_titulo: c.titulo })),
        ),
    );

    const isCompleted = (a: Actividad) => a.entregado || (a.nota !== null && a.nota !== undefined);
    const total      = actividades.length;
    const entregadas = actividades.filter(isCompleted).length;
    const pendientes = actividades.filter((a) => !isCompleted(a)).length;
    const conNota    = actividades.filter((a) => a.nota && !isNaN(parseFloat(a.nota)));
    const promedio   = conNota.length
        ? (conNota.reduce((s, a) => s + parseFloat(a.nota!), 0) / conNota.length).toFixed(1)
        : null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Mi Historial de Notas</h2>
                <p className="text-sm font-bold text-gray-400 mt-0.5">
                    Revisa tus actividades y entrega tus tareas pendientes.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    title="Promedio"
                    value={promedio ?? '--'}
                    icon={TrendingUp}
                    color="text-blue-600"
                    iconBg="bg-blue-500"
                />
                <StatCard
                    title="Total"
                    value={total}
                    icon={BookOpen}
                    color="text-gray-800"
                    iconBg="bg-gray-500"
                />
                <StatCard
                    title="Entregadas"
                    value={entregadas}
                    icon={CheckCircle2}
                    color="text-emerald-600"
                    iconBg="bg-emerald-500"
                />
                <StatCard
                    title="Pendientes"
                    value={pendientes}
                    icon={Clock}
                    color="text-rose-600"
                    iconBg="bg-rose-500"
                />
            </div>

            {/* Units */}
            {unidades.length === 0 ? (
                <div className="py-20 text-center opacity-30">
                    <FileText size={56} className="mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">No hay actividades registradas</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {unidades.map((u, uIdx) => {
                        const isOpen = openUnits.has(u.unidad_id);
                        const allActs = u.clases.flatMap((c) =>
                            c.actividades.map((a) => ({ ...a, clase_titulo: c.titulo })),
                        );
                        if (allActs.length === 0) return null;

                        const unitNotes = allActs.filter((a) => a.nota && !isNaN(parseFloat(a.nota)));
                        const unitProm  = unitNotes.length
                            ? (unitNotes.reduce((s, a) => s + parseFloat(a.nota!), 0) / unitNotes.length).toFixed(1)
                            : null;

                        return (
                            <Card key={u.unidad_id} className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
                                {/* Unit header */}
                                <button
                                    onClick={() => toggleUnit(u.unidad_id)}
                                    className="w-full flex items-center justify-between p-5 sm:p-6 bg-gray-50/60 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow shadow-blue-100 shrink-0">
                                            U{uIdx + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900 text-sm sm:text-base leading-tight">{u.titulo}</h3>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                                                {allActs.length} actividad{allActs.length !== 1 ? 'es' : ''}
                                                {unitProm && <span className={`ml-2 ${getNoteColor(unitProm)}`}>• Prom. {unitProm}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    {isOpen ? (
                                        <ChevronUp size={16} className="text-gray-400 shrink-0" />
                                    ) : (
                                        <ChevronDown size={16} className="text-gray-400 shrink-0" />
                                    )}
                                </button>

                                {/* Activities */}
                                {isOpen && (
                                    <div className="divide-y divide-gray-50">
                                        {allActs.map((act, aIdx) => {
                                            const tipNombre = act.tipoActividad?.nombre ?? act.tipo_actividad?.nombre ?? 'Actividad';
                                            const isTarea   = act.id_tipo_actividad === 1;
                                            const fb        = feedback[act.actividad_id];

                                            return (
                                                <div
                                                    key={`${act.actividad_id}-${aIdx}`}
                                                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50/50 transition-colors"
                                                >
                                                    {/* Left: icon + info */}
                                                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                                                        <div className="size-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-black text-gray-900 text-sm leading-tight truncate">
                                                                {act.nombre_actividad ?? act.nombre}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                                                                    {tipNombre}
                                                                </span>
                                                                <span className="text-[9px] text-gray-300">•</span>
                                                                <span className="text-[9px] font-bold text-gray-400 truncate">
                                                                    {act.clase_titulo}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right: status + grade */}
                                                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5 shrink-0">
                                                        {/* Delivery status */}
                                                        <div className="flex flex-col items-start sm:items-end gap-1.5">
                                                            {act.nota !== null && act.nota !== undefined ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full whitespace-nowrap">
                                                                    <CheckCircle2 size={11} />
                                                                    Calificado
                                                                </span>
                                                            ) : act.entregado ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full whitespace-nowrap">
                                                                    <CheckCircle2 size={11} />
                                                                    Entregado
                                                                    {act.fecha_entrega && (
                                                                        <span className="font-bold opacity-70 ml-1">
                                                                            {new Date(act.fecha_entrega).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full whitespace-nowrap">
                                                                    <Clock size={11} />
                                                                    Pendiente
                                                                </span>
                                                            )}

                                                            {/* Upload button for tasks */}
                                                            {isTarea && !isCompleted(act) && (
                                                                <div className="w-full sm:w-auto">
                                                                    <input
                                                                        type="file"
                                                                        id={`file-${act.actividad_id}`}
                                                                        className="hidden"
                                                                        onChange={(e) =>
                                                                            e.target.files?.[0] &&
                                                                            handleUpload(act.actividad_id, e.target.files[0])
                                                                        }
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        disabled={uploading === act.actividad_id}
                                                                        onClick={() =>
                                                                            document
                                                                                .getElementById(`file-${act.actividad_id}`)
                                                                                ?.click()
                                                                        }
                                                                        className="h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-[10px] font-bold uppercase tracking-wide gap-1.5 w-full sm:w-auto"
                                                                    >
                                                                        {uploading === act.actividad_id ? (
                                                                            <><Loader2 size={11} className="animate-spin" /> Subiendo...</>
                                                                        ) : (
                                                                            <><Upload size={11} /> Subir Tarea</>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {fb && <UploadResult ok={fb.ok} msg={fb.msg} />}
                                                        </div>

                                                        {/* Grade */}
                                                        <div className={`size-14 rounded-2xl ring-2 flex flex-col items-center justify-center shrink-0 ${getNoteRing(act.nota)}`}>
                                                            <span className={`text-xl font-black leading-none ${getNoteColor(act.nota)}`}>
                                                                {act.nota ?? '--'}
                                                            </span>
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                                                                Nota
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
