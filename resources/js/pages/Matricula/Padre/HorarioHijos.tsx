import { Head } from '@inertiajs/react';
import { CalendarDays, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import HorarioSemanal from '@/pages/HorarioClases/components/HorarioSemanal';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Portal Familia', href: '/padre/dashboard' },
    { title: 'Horario de Clases', href: '#' },
];

const ANIO_ACTUAL = new Date().getFullYear();

export default function HorarioHijosPage() {
    const [hijos, setHijos]           = useState<any[]>([]);
    const [horarios, setHorarios]     = useState<Record<number, any>>({});
    const [loadingHijos, setLoadingHijos] = useState(true);
    const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
    const [expanded, setExpanded]     = useState<number | null>(null);
    const [anio, setAnio]             = useState(ANIO_ACTUAL);

    // Cargar hijos al montar
    useEffect(() => {
        api.get('/padre/hijos')
            .then(res => {
                const data = res.data ?? [];
                setHijos(data);
                if (data.length > 0) setExpanded(data[0].estu_id);
            })
            .finally(() => setLoadingHijos(false));
    }, []);

    // Cargar horario cuando se expande un hijo o cambia el año
    useEffect(() => {
        if (expanded === null) return;
        cargarHorario(expanded, anio);
    }, [expanded, anio]);

    const cargarHorario = async (estuId: number, year: number) => {
        setLoadingMap(prev => ({ ...prev, [estuId]: true }));
        try {
            const res = await api.get(`/padre/hijo/${estuId}/horario`, { params: { anio: year } });
            setHorarios(prev => ({ ...prev, [estuId]: res.data.horario ?? {} }));
        } catch {
            setHorarios(prev => ({ ...prev, [estuId]: {} }));
        } finally {
            setLoadingMap(prev => ({ ...prev, [estuId]: false }));
        }
    };

    const toggle = (estuId: number) => {
        setExpanded(prev => prev === estuId ? null : estuId);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Horario de Clases" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <CalendarDays className="size-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Horario de Clases</h1>
                            <p className="text-sm text-gray-500">Horario semanal de tus hijos</p>
                        </div>
                    </div>

                    {/* Selector de año */}
                    <select
                        value={anio}
                        onChange={e => setAnio(parseInt(e.target.value))}
                        className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* Lista de hijos */}
                {loadingHijos ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="size-8 animate-spin text-blue-600" />
                    </div>
                ) : hijos.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-medium">
                        No tienes hijos registrados.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {hijos.map(hijo => {
                            const estuId   = hijo.estu_id;
                            const isOpen   = expanded === estuId;
                            const loading  = loadingMap[estuId] ?? false;
                            const horario  = horarios[estuId] ?? null;
                            const nombre   = `${hijo.perfil?.primer_nombre ?? ''} ${hijo.perfil?.apellido_paterno ?? ''}`.trim();
                            const inicial  = nombre[0] ?? '?';

                            return (
                                <div key={estuId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                    {/* Cabecera del hijo */}
                                    <button
                                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                                        onClick={() => toggle(estuId)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm">
                                                {inicial}
                                            </div>
                                            <span className="font-bold text-gray-900 capitalize">{nombre}</span>
                                        </div>
                                        {isOpen
                                            ? <ChevronUp className="size-4 text-gray-400" />
                                            : <ChevronDown className="size-4 text-gray-400" />
                                        }
                                    </button>

                                    {/* Horario expandido */}
                                    {isOpen && (
                                        <div className="border-t border-gray-100 p-4">
                                            {loading ? (
                                                <div className="flex justify-center py-10">
                                                    <Loader2 className="size-6 animate-spin text-blue-600" />
                                                </div>
                                            ) : (
                                                <HorarioSemanal
                                                    horario={horario ?? {}}
                                                    editable={false}
                                                    showDocente={true}
                                                    showSeccion={false}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
