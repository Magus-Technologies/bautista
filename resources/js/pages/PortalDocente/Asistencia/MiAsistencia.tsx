import { Head } from '@inertiajs/react';
import { CalendarCheck, Clock, AlertCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import SectionCard from '@/components/shared/SectionCard';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Mi Portal', href: '/docente/mis-cursos' },
    { title: 'Mi Asistencia', href: '/docente/asistencia' },
];

interface AsistenciaData {
    asistencia_id?: number;
    fecha: string;
    estado: string;
    turno?: string;
    hora_entrada?: string;
    hora_salida?: string;
}

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getStatusColor(estado: string) {
    switch (estado) {
        case '1': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        case '0': return 'text-red-600 bg-red-50 border-red-100';
        case 'T': return 'text-orange-600 bg-orange-50 border-orange-100';
        default:  return 'text-gray-600 bg-gray-50 border-gray-100';
    }
}

function getStatusLabel(estado: string) {
    switch (estado) {
        case '1': return 'Asistió';
        case '0': return 'Falta';
        case 'T': return 'Tardanza';
        default:  return 'Desconocido';
    }
}

export default function MiAsistencia() {
    const [asistencias, setAsistencias]   = useState<AsistenciaData[]>([]);
    const [loading, setLoading]           = useState(true);
    const [currentDate, setCurrentDate]   = useState(new Date());
    const [viewMode, setViewMode]         = useState<'calendar' | 'table'>('calendar');
    const [showHistorial, setShowHistorial] = useState(false);

    const stats = useMemo(() => {
        const total            = asistencias.length;
        const totalAsistencias = asistencias.filter(a => a.estado === '1').length;
        const totalFaltas      = asistencias.filter(a => a.estado === '0').length;
        const totalTardanzas   = asistencias.filter(a => a.estado === 'T').length;
        const porcentaje       = total > 0 ? ((totalAsistencias / total) * 100).toFixed(1) : '0';
        return { total, totalAsistencias, totalFaltas, totalTardanzas, porcentaje };
    }, [asistencias]);

    useEffect(() => {
        api.get('/docente/mi-asistencia', {
            params: {
                mes:  currentDate.getMonth() + 1,
                anio: currentDate.getFullYear(),
            },
        })
            .then(res => setAsistencias(res.data))
            .catch(err => console.error('Error fetching attendance:', err))
            .finally(() => setLoading(false));
    }, [currentDate.getMonth(), currentDate.getFullYear()]);

    const getCalendarDays = () => {
        const year  = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const first = new Date(year, month, 1);
        const last  = new Date(year, month + 1, 0);
        const days: (Date | null)[] = [];
        for (let i = 0; i < first.getDay(); i++) days.push(null);
        for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
        return days;
    };

    const getAsistenciaForDate = (date: Date | null) => {
        if (!date) return null;
        const ds = date.toISOString().split('T')[0];
        return asistencias.find(a => a.fecha.split('T')[0] === ds || a.fecha.split(' ')[0] === ds);
    };

    const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth     = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mi Asistencia" />

            <div className="flex flex-col gap-8 p-6">
                <PageHeader
                    icon={CalendarCheck}
                    title="Mi Asistencia"
                    subtitle="Historial personal de ingresos y salidas al plantel"
                    iconColor="bg-emerald-600"
                />

                {/* Stats */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 rounded-xl p-3"><CheckCircle className="size-8" /></div>
                                <div className="text-right">
                                    <div className="text-3xl font-black">{stats.totalAsistencias}</div>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-90">Asistencias</div>
                                </div>
                            </div>
                            <div className="text-xs opacity-75">Total de días asistidos</div>
                        </div>

                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 rounded-xl p-3"><XCircle className="size-8" /></div>
                                <div className="text-right">
                                    <div className="text-3xl font-black">{stats.totalFaltas}</div>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-90">Faltas</div>
                                </div>
                            </div>
                            <div className="text-xs opacity-75">Total de inasistencias</div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 rounded-xl p-3"><AlertTriangle className="size-8" /></div>
                                <div className="text-right">
                                    <div className="text-3xl font-black">{stats.totalTardanzas}</div>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-90">Tardanzas</div>
                                </div>
                            </div>
                            <div className="text-xs opacity-75">Total de llegadas tarde</div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 rounded-xl p-3"><TrendingUp className="size-8" /></div>
                                <div className="text-right">
                                    <div className="text-3xl font-black">{stats.porcentaje}%</div>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-90">Porcentaje</div>
                                </div>
                            </div>
                            <div className="text-xs opacity-75">Tasa de asistencia</div>
                        </div>
                    </div>
                )}

                {/* Toggle vista */}
                <div className="flex justify-end gap-2">
                    <button onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        <CalendarIcon className="inline-block size-4 mr-2" />Calendario
                    </button>
                    <button onClick={() => setShowHistorial(true)}
                        className="px-4 py-2 rounded-lg text-sm font-bold transition-all bg-gray-100 text-gray-600 hover:bg-gray-200">
                        <Clock className="inline-block size-4 mr-2" />Lista
                    </button>
                </div>

                {viewMode === 'calendar' && (
                    <SectionCard title={`Calendario — ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}>
                        {loading ? (
                            <div className="py-12 text-center text-sm font-black uppercase tracking-widest text-emerald-600 animate-pulse">Cargando...</div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <button onClick={previousMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                        <ChevronLeft className="size-5 text-gray-600" />
                                    </button>
                                    <h3 className="text-base sm:text-xl font-black text-gray-800 uppercase tracking-wide">
                                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </h3>
                                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                        <ChevronRight className="size-5 text-gray-600" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                    {dayNames.map(d => (
                                        <div key={d} className="text-center py-1 sm:py-2 text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-wider">
                                            <span className="sm:hidden">{d[0]}</span>
                                            <span className="hidden sm:inline">{d}</span>
                                        </div>
                                    ))}
                                    {getCalendarDays().map((date, i) => {
                                        const asis    = getAsistenciaForDate(date);
                                        const isToday = date?.toDateString() === new Date().toDateString();
                                        const statusDot = asis?.estado === '1' ? 'bg-emerald-400' : asis?.estado === '0' ? 'bg-red-400' : asis?.estado === 'T' ? 'bg-orange-400' : '';
                                        return (
                                            <div key={i} className={`min-h-[40px] sm:min-h-[90px] p-1 sm:p-2 rounded-lg border transition-all ${date ? isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200' : 'bg-gray-50 border-transparent'}`}>
                                                {date && (
                                                    <>
                                                        <div className={`text-xs sm:text-sm font-bold mb-0.5 sm:mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{date.getDate()}</div>
                                                        {/* Mobile: solo punto de color */}
                                                        {asis && (
                                                            <div className="sm:hidden flex justify-center mt-1">
                                                                <div className={`w-2 h-2 rounded-full ${statusDot}`} />
                                                            </div>
                                                        )}
                                                        {/* Desktop: etiqueta + horas */}
                                                        {asis && (
                                                            <div className="hidden sm:block space-y-1">
                                                                <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${asis.estado === '1' ? 'bg-emerald-100 text-emerald-700' : asis.estado === '0' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                    {getStatusLabel(asis.estado)}
                                                                </div>
                                                                {asis.hora_entrada && <div className="text-[10px] text-gray-500 font-mono">↓ {asis.hora_entrada}</div>}
                                                                {asis.hora_salida  && <div className="text-[10px] text-gray-500 font-mono">↑ {asis.hora_salida}</div>}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-4 justify-center pt-4 border-t border-gray-100">
                                    {[['bg-emerald-400', 'bg-emerald-100 border-emerald-200', 'Asistió'], ['bg-red-400', 'bg-red-100 border-red-200', 'Falta'], ['bg-orange-400', 'bg-orange-100 border-orange-200', 'Tardanza']].map(([dot, cls, label]) => (
                                        <div key={label} className="flex items-center gap-1.5">
                                            <div className={`sm:hidden w-3 h-3 rounded-full ${dot}`} />
                                            <div className={`hidden sm:block w-4 h-4 rounded border ${cls}`} />
                                            <span className="text-xs text-gray-600">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </SectionCard>
                )}

                {/* Modal historial */}
                <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
                    <DialogContent className="w-full max-w-lg sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">
                        <DialogHeader className="px-5 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
                            <DialogTitle className="text-base font-black uppercase tracking-tight text-gray-900">
                                Historial de Asistencia
                            </DialogTitle>
                            <p className="text-xs text-emerald-600 font-bold">{asistencias.length} registros</p>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="py-12 text-center text-sm font-black uppercase tracking-widest text-emerald-600 animate-pulse">Cargando...</div>
                            ) : asistencias.length === 0 ? (
                                <div className="py-12 text-center text-gray-400">
                                    <AlertCircle className="mx-auto mb-2 size-8 opacity-20" />
                                    <p className="text-sm">No hay registros para este período.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop — tabla */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest">
                                                    <th className="py-3 pl-4">Fecha</th>
                                                    <th className="py-3">Turno</th>
                                                    <th className="py-3">Entrada</th>
                                                    <th className="py-3">Salida</th>
                                                    <th className="py-3 pr-4 text-center">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {asistencias.map((log, idx) => (
                                                    <tr key={log.asistencia_id ?? idx} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-3 pl-4 font-bold text-gray-800 text-sm">
                                                            {new Date(log.fecha).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                        </td>
                                                        <td className="py-3 text-xs font-black text-indigo-600 uppercase tracking-tighter">
                                                            {log.turno === 'M' ? 'Mañana' : log.turno === 'T' ? 'Tarde' : log.turno === 'N' ? 'Noche' : '-'}
                                                        </td>
                                                        <td className="py-3 font-mono text-xs font-bold text-gray-600">
                                                            <span className="flex items-center gap-1"><Clock className="size-3 text-emerald-500" />{log.hora_entrada ?? '--:--'}</span>
                                                        </td>
                                                        <td className="py-3 font-mono text-xs font-bold text-gray-600">
                                                            <span className="flex items-center gap-1"><Clock className="size-3 text-rose-500" />{log.hora_salida ?? '--:--'}</span>
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            <div className={`mx-auto w-fit rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusColor(log.estado)}`}>
                                                                {getStatusLabel(log.estado)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile — cards */}
                                    <div className="sm:hidden flex flex-col gap-2 p-4">
                                        {asistencias.map((log, idx) => (
                                            <div key={log.asistencia_id ?? idx} className={`rounded-xl border-2 p-3 ${getStatusColor(log.estado)}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-sm text-gray-800">
                                                        {new Date(log.fecha).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <span className={`text-[10px] font-black uppercase rounded px-2 py-0.5 ${getStatusColor(log.estado)}`}>
                                                        {getStatusLabel(log.estado)}
                                                    </span>
                                                </div>
                                                <div className="flex gap-4 text-xs text-gray-600">
                                                    <span className="font-bold">{log.turno === 'M' ? 'Mañana' : log.turno === 'T' ? 'Tarde' : 'Noche'}</span>
                                                    <span className="flex items-center gap-1"><Clock className="size-3 text-emerald-500" />{log.hora_entrada?.substring(0,5) ?? '--:--'}</span>
                                                    <span className="flex items-center gap-1"><Clock className="size-3 text-rose-500" />{log.hora_salida?.substring(0,5) ?? '--:--'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="rounded-2xl bg-emerald-50 p-6 border border-emerald-100">
                    <div className="flex gap-4">
                        <div className="rounded-xl bg-white p-3 shadow-sm text-emerald-600">
                            <AlertCircle className="size-6" />
                        </div>
                        <div>
                            <h4 className="font-black text-emerald-900 uppercase text-xs tracking-widest mb-1">Nota</h4>
                            <p className="text-sm text-emerald-700/80 leading-relaxed">
                                Recuerda marcar tu ingreso y salida usando tu QR personal en el scanner del plantel.
                                Ante cualquier discrepancia contacta con administración.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
