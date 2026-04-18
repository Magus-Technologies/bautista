import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Usuario, HistorialAsistencia } from '../hooks/useAsistencia';
import api from '@/lib/api';

type Props = {
    open: boolean;
    onClose: () => void;
    user: Usuario | null;
    tipo: 'E' | 'D';
};

const months = [
    { v: '1', l: 'Enero' }, { v: '2', l: 'Febrero' }, { v: '3', l: 'Marzo' },
    { v: '4', l: 'Abril' }, { v: '5', l: 'Mayo' }, { v: '6', l: 'Junio' },
    { v: '7', l: 'Julio' }, { v: '8', l: 'Agosto' }, { v: '9', l: 'Septiembre' },
    { v: '10', l: 'Octubre' }, { v: '11', l: 'Noviembre' }, { v: '12', l: 'Diciembre' }
];

const PER_PAGE = 15;

const turnoLabel = (t: string) =>
    t === 'M' ? 'Mañana' : t === 'T' ? 'Tarde' : t === 'N' ? 'Noche' : t;

const turnoCls = (t: string) =>
    t === 'M' ? 'bg-amber-100 text-amber-700'
    : t === 'T' ? 'bg-indigo-100 text-indigo-700'
    : 'bg-slate-100 text-slate-700';

export default function HistorialModal({ open, onClose, user, tipo }: Props) {
    const [filterType, setFilterType]     = useState<'mes' | 'rango'>('mes');
    const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
    const [selectedYear, setSelectedYear]   = useState(String(new Date().getFullYear()));
    const [fechaInicio, setFechaInicio]   = useState('');
    const [fechaFin, setFechaFin]         = useState('');

    const [history, setHistory]   = useState<HistorialAsistencia[]>([]);
    const [page, setPage]         = useState(1);
    const [hasMore, setHasMore]   = useState(false);
    const [loading, setLoading]   = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const sentinelRef = useRef<HTMLDivElement>(null);
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    // Reset al cambiar filtros
    useEffect(() => {
        setHistory([]);
        setPage(1);
        setHasMore(false);
    }, [open, user, tipo, filterType, selectedMonth, selectedYear, fechaInicio, fechaFin]);

    // Carga de datos
    const loadPage = useCallback(async (pageNum: number, append: boolean) => {
        if (!user) return;
        if (filterType === 'rango' && (!fechaInicio || !fechaFin)) return;

        const id = user.estu_id || user.docente_id;
        let url = `/asistencia/usuario/${id}?tipo=${tipo}&per_page=${PER_PAGE}&page=${pageNum}`;

        if (filterType === 'mes') {
            url += `&mes=${selectedMonth}&anio=${selectedYear}`;
        } else {
            url += `&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
        }

        if (append) setLoadingMore(true); else setLoading(true);

        try {
            const res = await api.get(url);
            const data = res.data;
            setHistory(prev => append ? [...prev, ...data.data] : data.data);
            setHasMore(data.current_page < data.last_page);
        } catch {
            if (!append) setHistory([]);
        } finally {
            if (append) setLoadingMore(false); else setLoading(false);
        }
    }, [user, tipo, filterType, selectedMonth, selectedYear, fechaInicio, fechaFin]);

    // Carga inicial (page=1)
    useEffect(() => {
        if (!open || !user) return;
        loadPage(1, false);
    }, [open, user, tipo, filterType, selectedMonth, selectedYear, fechaInicio, fechaFin]);

    // Carga de páginas siguientes
    useEffect(() => {
        if (page === 1) return;
        loadPage(page, true);
    }, [page]);

    // IntersectionObserver en el sentinel
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    setPage(p => p + 1);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading]);

    const handleExport = async () => {
        if (!user) return;
        const id = user.estu_id || user.docente_id;
        const nombre = `${user.perfil?.primer_nombre} ${user.perfil?.apellido_paterno}`;

        try {
            let url = `/asistencia/usuario/${id}/export?tipo=${tipo}`;
            let filename = `Asistencia_${nombre}`;

            if (filterType === 'mes') {
                url += `&mes=${selectedMonth}&anio=${selectedYear}`;
                filename += `_${months.find(m => m.v === selectedMonth)?.l}_${selectedYear}.xlsx`;
            } else {
                url += `&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
                filename += `_${fechaInicio}_${fechaFin}.xlsx`;
            }

            const response = await api.get(url, { responseType: 'blob' });
            const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = urlBlob;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(urlBlob);
        } catch {
            console.error('Error al descargar Excel');
        }
    };

    const handleFilterType = (t: 'mes' | 'rango') => {
        setFilterType(t);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl bg-white border-neutral-200 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header fijo */}
                <DialogHeader className="p-8 pb-4 border-b border-neutral-100 bg-neutral-50 shrink-0">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-black text-neutral-950 tracking-tight uppercase">
                                    Historial de Asistencia
                                </DialogTitle>
                                <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-1">
                                    {user?.perfil?.primer_nombre} {user?.perfil?.apellido_paterno}
                                </p>
                            </div>
                            <Button
                                onClick={handleExport}
                                disabled={filterType === 'rango' && (!fechaInicio || !fechaFin)}
                                variant="outline"
                                className="h-10 border-neutral-200 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 gap-2 font-bold text-xs disabled:opacity-50"
                            >
                                <Download className="h-4 w-4" /> Excel
                            </Button>
                        </div>

                        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                            {(['mes', 'rango'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => handleFilterType(t)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                                        filterType === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500'
                                    }`}
                                >
                                    <Calendar className="h-4 w-4" />
                                    {t === 'mes' ? 'Por Mes' : 'Por Rango'}
                                </button>
                            ))}
                        </div>

                        {filterType === 'mes' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Mes</Label>
                                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                        <SelectTrigger className="bg-white border-neutral-200 h-9 rounded-lg text-xs font-medium">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-neutral-200">
                                            {months.map(m => (
                                                <SelectItem key={m.v} value={m.v} className="text-xs font-medium">{m.l}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Año</Label>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="bg-white border-neutral-200 h-9 rounded-lg text-xs font-medium">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-neutral-200">
                                            {years.map(y => (
                                                <SelectItem key={y} value={String(y)} className="text-xs font-medium">{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {filterType === 'rango' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Fecha de inicio</Label>
                                    <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                                        className="bg-white border-neutral-200 h-9 rounded-lg text-xs font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Fecha de fin</Label>
                                    <Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                                        className="bg-white border-neutral-200 h-9 rounded-lg text-xs font-medium" />
                                </div>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {/* Cuerpo con scroll */}
                <div className="flex-1 overflow-y-auto p-8">
                    {/* Desktop — tabla */}
                    <div className="hidden md:block bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-[#00a65a]">
                                <TableRow className="border-green-600 hover:bg-transparent">
                                    {['Fecha','Turno','Entrada','Salida','Estado'].map(h => (
                                        <TableHead key={h} className="text-[10px] font-bold uppercase tracking-widest text-white text-center">{h}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-xs font-bold opacity-30 animate-pulse">Cargando...</TableCell>
                                    </TableRow>
                                ) : history.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-neutral-500 text-xs">
                                            {filterType === 'rango' && (!fechaInicio || !fechaFin)
                                                ? 'Selecciona un rango de fechas'
                                                : 'No hay registros para este periodo.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    history.map((log) => (
                                        <TableRow key={log.asistencia_id} className="border-neutral-100 hover:bg-neutral-50">
                                            <TableCell className="text-center font-mono text-sm text-neutral-600">
                                                {new Date(log.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`text-[9px] uppercase font-bold px-2 ${turnoCls(log.turno)}`}>
                                                    {turnoLabel(log.turno)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-emerald-600">
                                                {log.hora_entrada?.substring(0, 5) || '—'}
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-rose-600">
                                                {log.hora_salida?.substring(0, 5) || '—'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`text-[9px] uppercase font-bold px-2 ${
                                                    log.estado === '1' ? 'bg-emerald-100 text-emerald-700'
                                                    : log.estado === 'T' ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {log.estado === '1' ? 'Asistió' : log.estado === 'T' ? 'Tardanza' : 'Falta'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile — cards */}
                    <div className="md:hidden flex flex-col gap-3">
                        {loading ? (
                            <div className="py-16 text-center text-xs font-bold opacity-30 animate-pulse">Cargando...</div>
                        ) : history.length === 0 ? (
                            <div className="py-16 text-center text-neutral-500 text-xs border border-neutral-100 rounded-lg">
                                {filterType === 'rango' && (!fechaInicio || !fechaFin)
                                    ? 'Selecciona un rango de fechas'
                                    : 'No hay registros para este periodo.'}
                            </div>
                        ) : history.map((log) => (
                            <div key={log.asistencia_id} className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-neutral-400 uppercase">Fecha</span>
                                    <span className="font-mono text-sm text-neutral-900">
                                        {new Date(log.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-neutral-400 uppercase">Turno</span>
                                    <Badge className={`text-[9px] uppercase font-bold px-2 ${turnoCls(log.turno)}`}>
                                        {turnoLabel(log.turno)}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-emerald-600 uppercase">Entrada</span>
                                    <span className="font-bold text-emerald-600">{log.hora_entrada?.substring(0, 5) || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-rose-600 uppercase">Salida</span>
                                    <span className="font-bold text-rose-600">{log.hora_salida?.substring(0, 5) || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-neutral-400 uppercase">Estado</span>
                                    <Badge className={`text-[9px] uppercase font-bold px-2 ${
                                        log.estado === '1' ? 'bg-emerald-100 text-emerald-700'
                                        : log.estado === 'T' ? 'bg-orange-100 text-orange-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                        {log.estado === '1' ? 'Asistió' : log.estado === 'T' ? 'Tardanza' : 'Falta'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Sentinel + spinner de carga infinita */}
                    <div ref={sentinelRef} className="h-4" />
                    {loadingMore && (
                        <div className="py-4 text-center text-xs font-bold text-neutral-400 animate-pulse">
                            Cargando más registros...
                        </div>
                    )}
                    {!hasMore && history.length > 0 && !loading && (
                        <p className="py-4 text-center text-[10px] text-neutral-300 uppercase tracking-widest font-bold">
                            — Fin del historial —
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
