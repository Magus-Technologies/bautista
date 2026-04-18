import { Head } from '@inertiajs/react';
import { CalendarCheck, Clock, AlertCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import SectionCard from '@/components/shared/SectionCard';
import AppLayout from '@/layouts/app-layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Mi Portal', href: '/alumno/dashboard' },
    { title: 'Asistencia', href: '/alumno/asistencia' },
];

interface AsistenciaData {
    asistencia_id?: number;
    fecha: string;
    estado: string;
    turno?: string;
    hora_entrada?: string;
    hora_salida?: string;
}

function AsistenciaCard({ asistencia, fecha, getStatusLabel }: {
    asistencia: AsistenciaData;
    fecha: Date;
    getStatusLabel: (e: string) => string;
}) {
    return (
        <div className={`rounded-xl border-2 p-4 transition-all ${
            asistencia.estado === '1' ? 'border-emerald-200 bg-emerald-50/50'
            : asistencia.estado === '0' ? 'border-red-200 bg-red-50/50'
            : 'border-orange-200 bg-orange-50/50'
        }`}>
            <div className="flex items-start justify-between mb-2">
                <div>
                    <div className="text-xs font-black text-gray-500 uppercase tracking-wide">
                        {fecha.toLocaleDateString('es-PE', { weekday: 'short' })}
                    </div>
                    <div className="text-2xl font-black text-gray-900 leading-none">{fecha.getDate()}</div>
                    <div className="text-xs text-gray-500">
                        {fecha.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })}
                    </div>
                </div>
                <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest ${
                    asistencia.estado === '1' ? 'bg-emerald-100 text-emerald-700'
                    : asistencia.estado === '0' ? 'bg-red-100 text-red-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                    {getStatusLabel(asistencia.estado)}
                </span>
            </div>
            <div className="space-y-1 text-xs">
                {asistencia.turno && (
                    <div className="flex items-center gap-2 text-gray-500">
                        <CalendarIcon className="size-3" />
                        <span className="font-bold">
                            {asistencia.turno === 'M' ? 'Mañana' : asistencia.turno === 'T' ? 'Tarde' : asistencia.turno === 'N' ? 'Noche' : '-'}
                        </span>
                    </div>
                )}
                {asistencia.hora_entrada && (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="size-3 text-emerald-500" />
                        <span className="font-mono font-bold">Entrada: {asistencia.hora_entrada.substring(0, 5)}</span>
                    </div>
                )}
                {asistencia.hora_salida && (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="size-3 text-rose-500" />
                        <span className="font-mono font-bold">Salida: {asistencia.hora_salida.substring(0, 5)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Asistencia() {
    const [asistencias, setAsistencias] = useState<AsistenciaData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
    const [showHistorial, setShowHistorial] = useState(false);

    // Calcular estadísticas
    const stats = useMemo(() => {
        const totalAsistencias = asistencias.filter(a => a.estado === '1').length;
        const totalFaltas = asistencias.filter(a => a.estado === '0').length;
        const totalTardanzas = asistencias.filter(a => a.estado === 'T').length;
        const total = asistencias.length;
        const porcentaje = total > 0 ? ((totalAsistencias / total) * 100).toFixed(1) : '0';

        return {
            totalAsistencias,
            totalFaltas,
            totalTardanzas,
            total,
            porcentaje
        };
    }, [asistencias]);

    useEffect(() => {
        api.get('/alumno/asistencia')
            .then(res => setAsistencias(res.data))
            .catch(err => console.error("Error fetching attendance:", err))
            .finally(() => setLoading(false));
    }, []);

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case '1': return 'text-emerald-600 bg-emerald-50 border-emerald-100'; // Asistió
            case '0': return 'text-red-600 bg-red-50 border-red-100'; // Falta
            case 'T': return 'text-orange-600 bg-orange-50 border-orange-100'; // Tardanza
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    const getStatusLabel = (estado: string) => {
        switch (estado) {
            case '1': return 'Asistió';
            case '0': return 'Falta';
            case 'T': return 'Tardanza';
            default: return 'Desconocido';
        }
    };

    const getCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        
        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        
        return days;
    };

    const getAsistenciaForDate = (date: Date | null) => {
        if (!date) return null;
        const dateStr = date.toISOString().split('T')[0];
        return asistencias.find(a => a.fecha.split('T')[0] === dateStr || a.fecha.split(' ')[0] === dateStr);
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mi Asistencia" />
            
            <div className="flex flex-col gap-8 p-6">
                <PageHeader
                    icon={CalendarCheck}
                    title="Control de Asistencia"
                    subtitle="Consulta tu historial de ingresos y salidas diarias"
                    iconColor="bg-emerald-600"
                />

                {/* Statistics Cards */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Asistencias */}
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 rounded-xl p-3">
                                    <CheckCircle className="size-8" />
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black">{stats.totalAsistencias}</div>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-90">Asistencias</div>
                                </div>
                            </div>
                            <div className="text-xs opacity-75">Total de días asistidos</div>
                        </div>

                        {/* Total Faltas */}
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 rounded-xl p-3">
                                    <XCircle className="size-8" />
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black">{stats.totalFaltas}</div>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-90">Faltas</div>
                                </div>
                            </div>
                            <div className="text-xs opacity-75">Total de inasistencias</div>
                        </div>

                        {/* Total Tardanzas */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 rounded-xl p-3">
                                    <AlertTriangle className="size-8" />
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black">{stats.totalTardanzas}</div>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-90">Tardanzas</div>
                                </div>
                            </div>
                            <div className="text-xs opacity-75">Total de llegadas tarde</div>
                        </div>

                        {/* Porcentaje de Asistencia */}
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 rounded-xl p-3">
                                    <TrendingUp className="size-8" />
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black">{stats.porcentaje}%</div>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-90">Porcentaje</div>
                                </div>
                            </div>
                            <div className="text-xs opacity-75">Tasa de asistencia</div>
                        </div>
                    </div>
                )}

                {/* Últimas Asistencias — botón que abre modal */}
                {!loading && asistencias.length > 0 && (
                    <SectionCard
                        title="Últimas Asistencias"
                        action={
                            <button
                                onClick={() => setShowHistorial(true)}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 underline underline-offset-2"
                            >
                                Ver todas
                            </button>
                        }
                    >
                        {/* Preview: últimas 3 en mobile, 6 en desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {asistencias.slice(0, 3).map((asistencia, idx) => {
                                const fecha = new Date(asistencia.fecha);
                                return (
                                    <AsistenciaCard key={asistencia.asistencia_id || idx} asistencia={asistencia} fecha={fecha} getStatusLabel={getStatusLabel} />
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setShowHistorial(true)}
                            className="mt-4 w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                            Ver historial completo ({asistencias.length} registros)
                        </button>
                    </SectionCard>
                )}

                {/* Modal historial completo */}
                <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
                    <DialogContent className="w-full max-w-lg sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">
                        <DialogHeader className="px-5 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
                            <DialogTitle className="text-base font-black uppercase tracking-tight text-gray-900">
                                Historial de Asistencia
                            </DialogTitle>
                            <p className="text-xs text-emerald-600 font-bold">{asistencias.length} registros encontrados</p>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {asistencias.map((asistencia, idx) => {
                                const fecha = new Date(asistencia.fecha);
                                return (
                                    <AsistenciaCard key={asistencia.asistencia_id || idx} asistencia={asistencia} fecha={fecha} getStatusLabel={getStatusLabel} />
                                );
                            })}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* View Toggle */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            viewMode === 'calendar' 
                                ? 'bg-[#00a65a] text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <CalendarIcon className="inline-block size-4 mr-2" />
                        Calendario
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            viewMode === 'table' 
                                ? 'bg-[#00a65a] text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Clock className="inline-block size-4 mr-2" />
                        Lista
                    </button>
                </div>

                {viewMode === 'calendar' ? (
                    <SectionCard title="Calendario de Asistencia">
                        {loading ? (
                            <div className="py-12 text-center text-sm font-black uppercase tracking-widest text-indigo-600 animate-pulse">
                                Cargando calendario...
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={previousMonth}
                                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <ChevronLeft className="size-5 text-gray-600" />
                                    </button>
                                    <h3 className="text-base sm:text-xl font-black text-gray-800 uppercase tracking-wide">
                                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </h3>
                                    <button
                                        onClick={nextMonth}
                                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <ChevronRight className="size-5 text-gray-600" />
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                    {/* Day Names */}
                                    {dayNames.map(day => (
                                        <div key={day} className="text-center py-1 sm:py-2 text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-wider">
                                            <span className="sm:hidden">{day[0]}</span>
                                            <span className="hidden sm:inline">{day}</span>
                                        </div>
                                    ))}

                                    {/* Calendar Days */}
                                    {getCalendarDays().map((date, index) => {
                                        const asistencia = getAsistenciaForDate(date);
                                        const isToday = date && date.toDateString() === new Date().toDateString();
                                        const statusDot = asistencia?.estado === '1' ? 'bg-emerald-400' : asistencia?.estado === '0' ? 'bg-red-400' : asistencia?.estado === 'T' ? 'bg-orange-400' : '';

                                        return (
                                            <div
                                                key={index}
                                                className={`min-h-[40px] sm:min-h-[100px] p-1 sm:p-2 rounded-lg border transition-all ${
                                                    date
                                                        ? isToday
                                                            ? 'bg-blue-50 border-blue-200'
                                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                                        : 'bg-gray-50 border-transparent'
                                                }`}
                                            >
                                                {date && (
                                                    <>
                                                        <div className={`text-xs sm:text-sm font-bold mb-0.5 sm:mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                                            {date.getDate()}
                                                        </div>
                                                        {/* Mobile: punto de color */}
                                                        {asistencia && (
                                                            <div className="sm:hidden flex justify-center mt-0.5">
                                                                <div className={`w-2 h-2 rounded-full ${statusDot}`} />
                                                            </div>
                                                        )}
                                                        {/* Desktop: etiqueta + horas */}
                                                        {asistencia && (
                                                            <div className="hidden sm:block space-y-1">
                                                                <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${
                                                                    asistencia.estado === '1'
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : asistencia.estado === '0'
                                                                        ? 'bg-red-100 text-red-700'
                                                                        : 'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                    {getStatusLabel(asistencia.estado)}
                                                                </div>
                                                                {asistencia.hora_entrada && (
                                                                    <div className="text-[10px] text-gray-600 font-mono">
                                                                        ↓ {asistencia.hora_entrada}
                                                                    </div>
                                                                )}
                                                                {asistencia.hora_salida && (
                                                                    <div className="text-[10px] text-gray-600 font-mono">
                                                                        ↑ {asistencia.hora_salida}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="flex gap-4 justify-center mt-4 pt-4 border-t border-gray-200">
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
                ) : (
                    <SectionCard title="Historial Reciente">
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="py-12 text-center text-sm font-black uppercase tracking-widest text-indigo-600 animate-pulse">
                                    Cargando historial...
                                </div>
                            ) : asistencias.length === 0 ? (
                                <div className="py-12 text-center text-gray-400 italic">
                                    <AlertCircle className="mx-auto mb-2 size-8 opacity-20" />
                                    <p>No tienes registros de asistencia en este período.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-separate border-spacing-0 overflow-hidden rounded-xl border border-gray-100">
                                    <thead>
                                        <tr className="bg-[#00a65a] text-white text-[10px] font-black uppercase tracking-widest">
                                            <th className="py-3 pl-4 first:rounded-tl-xl border-b border-green-600">Fecha</th>
                                            <th className="py-3 border-b border-green-600">Turno</th>
                                            <th className="py-3 border-b border-green-600">Entrada</th>
                                            <th className="py-3 border-b border-green-600">Salida</th>
                                            <th className="py-3 pr-4 text-center last:rounded-tr-xl border-b border-green-600">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {asistencias.map((log, idx) => (
                                            <tr key={log.asistencia_id || idx} className="group transition-all hover:bg-gray-50/50">
                                                <td className="py-4 pl-4 font-bold text-gray-800">
                                                    {new Date(log.fecha).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                </td>
                                                <td className="py-4 text-xs font-black text-indigo-600 uppercase tracking-tighter">
                                                    {log.turno === 'M' ? 'Mañana' : log.turno === 'T' ? 'Tarde' : '-'}
                                                </td>
                                                <td className="py-4 font-mono text-xs font-bold text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="size-3 text-emerald-500" />
                                                        {log.hora_entrada || '--:--'}
                                                    </div>
                                                </td>
                                                <td className="py-4 font-mono text-xs font-bold text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="size-3 text-rose-500" />
                                                        {log.hora_salida || '--:--'}
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-4">
                                                    <div className={`mx-auto w-fit rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusColor(log.estado)}`}>
                                                        {getStatusLabel(log.estado)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </SectionCard>
                )}

                {/* Additional Info / Tips */}
                <div className="rounded-2xl bg-indigo-50 p-6 border border-indigo-100">
                    <div className="flex gap-4">
                        <div className="rounded-xl bg-white p-3 shadow-sm text-indigo-600">
                            <AlertCircle className="size-6" />
                        </div>
                        <div>
                            <h4 className="font-black text-indigo-900 uppercase text-xs tracking-widest mb-1">Nota Importante</h4>
                            <p className="text-sm text-indigo-700/80 leading-relaxed">
                                Recuerda marcar tu asistencia al ingresar y salir del plantel utilizando tu QR personal. 
                                Si encuentras alguna discrepancia en tus registros, por favor contacta con secretaría académica.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
