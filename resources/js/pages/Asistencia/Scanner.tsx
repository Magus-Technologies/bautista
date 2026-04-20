import { Head } from '@inertiajs/react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
    QrCode, Shield, Clock, UserCheck, History,
    Zap, Settings, ScanLine, Keyboard, GraduationCap, BookOpen,
    CheckCircle2, XCircle, User, Tag, Contact
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Asistencia',  href: '/asistencia' },
    { title: 'Escáner QR', href: '/asistencia/scanner' },
];

type ScanResult = {
    message: string;
    turno:   string;
    hora?:   string;
    tipo?:   string;
    nombre?: string;
    user?:   { 
        primer_nombre?: string; 
        apellido_paterno?: string;
        doc_numero?: string;
    } | null;
};

type ModoInput = 'camara' | 'pistola' | 'dni';

// ── Card temporal que aparece tras un escaneo ─────────────────────────────────
function ScanCard({ result, error, tipo }: { result: ScanResult | null; error: string | null; tipo: 'entrada' | 'salida' }) {
    if (!result && !error) return null;

    if (error) {
        return (
            <div className="animate-in zoom-in-95 duration-300 w-[280px] mx-auto rounded-xl p-6 flex flex-col items-center text-center shadow-xl bg-rose-600 text-white">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-10 h-10 text-white" />
                </div>
                <p className="text-sm font-bold leading-snug">{error}</p>
            </div>
        );
    }

    const nombre = result
        ? (result.nombre ?? (result.user ? `${result.user.primer_nombre ?? ''} ${result.user.apellido_paterno ?? ''}`.trim() : ''))
        : '';
    const esEstudiante = result?.tipo === 'E';
    const esDocente    = result?.tipo === 'D';
    const dni = result?.user?.doc_numero ?? '—';
    const message = result?.message ?? 'Asistencia registrada.';
    const rol = esEstudiante ? 'Alumno' : (esDocente ? 'Docente' : 'Personal');

    // Fondo verde o rojo estricto y centrado
    const cardBg = tipo === 'entrada' ? 'bg-[#0EA25E]' : 'bg-[#E11D48]';

    return (
        <div className={`animate-in zoom-in-95 duration-300 w-full max-w-[320px] mx-auto rounded-[1.25rem] p-6 flex flex-col items-center text-center shadow-xl text-white ${cardBg}`}>
            {/* Avatar circular gris */}
            <div className="w-24 h-24 bg-[#cccccc] rounded-full flex items-center justify-center mb-4 overflow-hidden shadow-inner">
                <User className="w-12 h-12 text-white/90 translate-y-2 scale-[1.2]" />
            </div>

            {/* Nombre */}
            <h3 className="text-xl font-semibold mb-2 leading-tight tracking-wide">{nombre}</h3>

            {/* DNI */}
            <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                <Contact className="w-4 h-4 opacity-80" /> 
                <span className="opacity-90">DNI: {dni}</span>
            </div>

            {/* Rol */}
            <div className="flex items-center gap-1.5 text-sm font-medium mb-3">
                <Tag className="w-4 h-4 opacity-80 fill-white/20" /> 
                <span className="opacity-90">{rol}</span>
            </div>

            {/* Mensaje de registro */}
            <div className="flex items-center gap-1.5 font-bold text-sm mt-3 mb-1.5">
                <CheckCircle2 className="w-5 h-5 fill-white text-[#0EA25E]" /> 
                <span>{message}</span>
            </div>

            {/* Hora */}
            <div className="flex items-center gap-1.5 text-sm font-bold opacity-90">
                <Clock className="w-4 h-4" /> 
                {result?.hora}
            </div>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AsistenciaScanner() {
    const [lastScan, setLastScan]       = useState<ScanResult | null>(null);
    const [historial, setHistorial]     = useState<any[]>([]);
    const [tipo, setTipo]               = useState<'entrada' | 'salida'>('entrada');
    const [error, setError]             = useState<string | null>(null);
    const [scanning, setScanning]       = useState(false);
    const [isSecure, setIsSecure]       = useState(true);
    const [modo, setModo]               = useState<ModoInput>('camara');
    const [inputVal, setInputVal]       = useState('');
    const [processing, setProcessing]   = useState(false);

    const scannerRef  = useRef<Html5QrcodeScanner | null>(null);
    const tipoRef     = useRef(tipo);
    const scanningRef = useRef(false);
    const inputRef    = useRef<HTMLInputElement>(null);
    const clearTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') setIsSecure(window.isSecureContext);
    }, []);

    useEffect(() => {
        tipoRef.current     = tipo;
        scanningRef.current = scanning;
    }, [tipo, scanning]);

    // ── Cargar / limpiar cámara según modo ────────────────────────────────────
    useEffect(() => {
        loadHistorial();

        if (modo === 'camara' && !scannerRef.current && window.isSecureContext) {
            scannerRef.current = new Html5QrcodeScanner(
                'reader',
                { fps: 20, qrbox: { width: 450, height: 350 }, aspectRatio: 1.0, showTorchButtonIfSupported: true, showZoomSliderIfSupported: true },
                false,
            );
            scannerRef.current.render(onScanSuccess, () => undefined);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
                scannerRef.current = null;
            }
        };
    }, [modo]);

    // Auto-focus input en modo pistola
    useEffect(() => {
        if (modo === 'pistola') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [modo]);

    const loadHistorial = () => {
        api.get('/asistencia/historial').then(res => setHistorial(res.data));
    };

    // Limpiar tarjeta después de N segundos
    const scheduleCardClear = useCallback((ms = 4000) => {
        if (clearTimer.current) clearTimeout(clearTimer.current);
        clearTimer.current = setTimeout(() => {
            setLastScan(null);
            setError(null);
        }, ms);
    }, []);

    // ── Scan por cámara ───────────────────────────────────────────────────────
    function onScanSuccess(decodedText: string) {
        if (scanningRef.current) return;
        setScanning(true);
        api.post('/asistencia/marcar-qr', { qr_data: decodedText, tipo_marcado: tipoRef.current })
            .then(res => { setLastScan(res.data); setError(null); loadHistorial(); scheduleCardClear(); })
            .catch(err => { setError(err.response?.data?.message ?? 'Error al procesar QR'); scheduleCardClear(5000); })
            .finally(() => setTimeout(() => setScanning(false), 2000));
    }

    const handlePistolaSendRef = useRef<((val: string) => Promise<void>) | null>(null);

    // ── Procesar input de pistola / DNI ───────────────────────────────────────
    const handlePistolaSend = async (value: string) => {
        const val = value.trim();
        if (!val || processing) return;

        setProcessing(true);
        setLastScan(null);
        setError(null);
        setInputVal('');

        try {
            // Si tiene 6-15 caracteres numéricos → DNI; si no → dato QR
            const isDni = /^\d{6,15}$/.test(val);
            const res = isDni
                ? await api.post('/asistencia/marcar-dni', { dni: val, tipo_marcado: tipo })
                : await api.post('/asistencia/marcar-qr',  { qr_data: val, tipo_marcado: tipo });

            setLastScan(res.data);
            setError(null);
            loadHistorial();
            scheduleCardClear();
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'No se encontró el registro');
            scheduleCardClear(5000);
        } finally {
            setProcessing(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    useEffect(() => {
        handlePistolaSendRef.current = handlePistolaSend;
    });

    // Envío automático (debounce) para pistola QR
    useEffect(() => {
        if (modo === 'pistola' && inputVal.trim() !== '') {
            const timer = setTimeout(() => {
                if (handlePistolaSendRef.current) {
                    handlePistolaSendRef.current(inputVal);
                }
            }, 100); // Si deja de escribir por 100ms, se autodispara
            return () => clearTimeout(timer);
        }
    }, [inputVal, modo]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Escáner QR - Asistencia" />

            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-neutral-50/50">

                {/* ── Izquierda: Lector ─────────────────────────────────────── */}
                <div className="flex-1 p-6 md:p-10 flex flex-col space-y-8">

                    {/* Header */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <QrCode className="h-5 w-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Control de Asistencia</span>
                        </div>
                        <h1 className="text-3xl font-black text-neutral-950 tracking-tight">
                            Escáner de <span className="text-emerald-600">Asistencia</span>
                        </h1>
                        <p className="text-neutral-500 text-sm font-medium">
                            Usa la cámara, la pistola QR o ingresa el DNI manualmente para registrar asistencia.
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-start py-4">
                        <div className="w-full max-w-2xl space-y-6">

                            {/* Selector Entrada/Salida */}
                            <div className="bg-white border border-neutral-200 p-1.5 rounded-2xl shadow-sm flex gap-1.5 max-w-sm mx-auto">
                                <button type="button" onClick={() => setTipo('entrada')}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                        tipo === 'entrada' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-neutral-400 hover:bg-neutral-50'
                                    }`}>
                                    <Zap className={`w-3.5 h-3.5 ${tipo === 'entrada' ? 'fill-white' : ''}`} />
                                    Entrada
                                </button>
                                <button type="button" onClick={() => setTipo('salida')}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                        tipo === 'salida' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'text-neutral-400 hover:bg-neutral-50'
                                    }`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    Salida
                                </button>
                            </div>

                            {/* Selector de modo: Cámara | Pistola QR | DNI Manual */}
                            <div className="bg-white border border-neutral-200 p-1 rounded-xl shadow-sm flex gap-1 max-w-sm mx-auto">
                                <button type="button" onClick={() => setModo('camara')}
                                    className={`flex-1 py-2 px-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                                        modo === 'camara' ? 'bg-neutral-900 text-white shadow' : 'text-neutral-400 hover:bg-neutral-50'
                                    }`}>
                                    <ScanLine className="w-3.5 h-3.5" /> Cámara
                                </button>
                                <button type="button" onClick={() => setModo('pistola')}
                                    className={`flex-1 py-2 px-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                                        modo === 'pistola' ? 'bg-neutral-900 text-white shadow' : 'text-neutral-400 hover:bg-neutral-50'
                                    }`}>
                                    <Keyboard className="w-3.5 h-3.5" /> Pistola QR
                                </button>
                                <button type="button" onClick={() => setModo('dni')}
                                    className={`flex-1 py-2 px-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                                        modo === 'dni' ? 'bg-neutral-900 text-white shadow' : 'text-neutral-400 hover:bg-neutral-50'
                                    }`}>
                                    <UserCheck className="w-3.5 h-3.5" /> DNI
                                </button>
                            </div>

                            {/* ── Modo Cámara ────────────────────────────────── */}
                            {modo === 'camara' && (
                                <div className="relative group max-w-xl mx-auto w-full">
                                    <div className={`absolute -inset-1 rounded-[2.5rem] blur opacity-25 transition duration-500 group-hover:opacity-40 ${
                                        tipo === 'entrada' ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`} />
                                    <div className="relative aspect-square bg-white rounded-[2rem] border-2 border-neutral-200 p-3 overflow-hidden shadow-xl">
                                        {!isSecure ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-rose-50 rounded-xl space-y-4">
                                                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                                                    <Shield className="w-8 h-8 text-rose-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-rose-900 font-black uppercase text-sm tracking-tight">Conexión Insegura</h3>
                                                    <p className="text-rose-600 text-xs font-medium leading-relaxed">
                                                        El acceso a la cámara requiere una conexión <span className="font-black">HTTPS</span>. Usa el modo <strong>Pistola / DNI</strong> mientras tanto.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div id="reader" className="w-full h-full overflow-hidden rounded-xl border border-neutral-100" />
                                                {scanning && (
                                                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300 z-50">
                                                        <div className={`w-12 h-12 border-4 rounded-full animate-spin mb-4 ${
                                                            tipo === 'entrada' ? 'border-emerald-600 border-t-transparent' : 'border-rose-600 border-t-transparent'
                                                        }`} />
                                                        <span className="font-extrabold uppercase tracking-[0.3em] text-[10px] text-neutral-600">Procesando...</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── Modo Pistola QR ────────────────────────────── */}
                            {modo === 'pistola' && (
                                <div className="max-w-xl mx-auto w-full space-y-4">
                                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center space-y-1">
                                        <p className="text-xs font-black text-blue-800 uppercase tracking-wide flex items-center justify-center gap-2">
                                            <Keyboard className="w-4 h-4" /> Pistola QR
                                        </p>
                                        <p className="text-[11px] text-blue-600 font-medium">
                                            Apunta la pistola al código QR del carnet — el registro es <strong>automático</strong>, no necesitas presionar nada.
                                        </p>
                                    </div>

                                    <div className="relative">
                                        <div className={`absolute -inset-0.5 rounded-2xl blur-sm opacity-30 ${tipo === 'entrada' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                        <div className="relative bg-white rounded-xl border-2 border-neutral-200 overflow-hidden shadow-lg focus-within:border-emerald-400 transition-colors">
                                            <div className="flex items-center px-4 py-3 gap-3">
                                                <ScanLine className={`w-5 h-5 shrink-0 ${tipo === 'entrada' ? 'text-emerald-500' : 'text-rose-500'}`} />
                                                <Input
                                                    ref={inputRef}
                                                    value={inputVal}
                                                    onChange={e => setInputVal(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handlePistolaSend(inputVal); } }}
                                                    placeholder="Esperando lectura de pistola QR..."
                                                    className="border-0 shadow-none text-base font-semibold focus-visible:ring-0 p-0 h-auto bg-transparent"
                                                    disabled={processing}
                                                    autoComplete="off"
                                                    autoFocus
                                                />
                                                {processing && (
                                                    <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-center text-neutral-400 font-medium">
                                        La pistola envía Enter automáticamente al terminar de leer el QR.
                                    </p>
                                </div>
                            )}

                            {/* ── Modo DNI Manual ─────────────────────────────── */}
                            {modo === 'dni' && (
                                <div className="max-w-xl mx-auto w-full space-y-4">
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center space-y-1">
                                        <p className="text-xs font-black text-amber-800 uppercase tracking-wide flex items-center justify-center gap-2">
                                            <UserCheck className="w-4 h-4" /> Ingreso por DNI
                                        </p>
                                        <p className="text-[11px] text-amber-700 font-medium">
                                            Escribe el número de DNI y presiona <kbd className="bg-white border border-amber-200 rounded px-1.5 py-0.5 text-[10px] font-black">Enter</kbd> o el botón para registrar.
                                        </p>
                                    </div>

                                    <div className="relative">
                                        <div className={`absolute -inset-0.5 rounded-2xl blur-sm opacity-30 ${tipo === 'entrada' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                        <div className="relative bg-white rounded-xl border-2 border-neutral-200 overflow-hidden shadow-lg focus-within:border-emerald-400 transition-colors">
                                            <div className="flex items-center px-4 py-3 gap-3">
                                                <UserCheck className={`w-5 h-5 shrink-0 ${tipo === 'entrada' ? 'text-emerald-500' : 'text-rose-500'}`} />
                                                <Input
                                                    ref={inputRef}
                                                    value={inputVal}
                                                    onChange={e => setInputVal(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handlePistolaSend(inputVal); } }}
                                                    placeholder="Escribe el DNI aquí..."
                                                    className="border-0 shadow-none text-base font-semibold focus-visible:ring-0 p-0 h-auto bg-transparent"
                                                    disabled={processing}
                                                    autoComplete="off"
                                                    inputMode="numeric"
                                                    maxLength={15}
                                                    autoFocus
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={!inputVal.trim() || processing}
                                                    onClick={() => handlePistolaSend(inputVal)}
                                                    className={`shrink-0 rounded-lg font-bold text-xs h-9 px-4 ${
                                                        tipo === 'entrada'
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                                                    }`}
                                                >
                                                    {processing ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        </span>
                                                    ) : 'Registrar'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Tarjeta de resultado (ambos modos) ─────────── */}
                            <div className="max-w-xl mx-auto w-full min-h-[90px]">
                                <ScanCard result={lastScan} error={error} tipo={tipo} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Derecha: Historial ────────────────────────────────────── */}
                <div className="w-full lg:w-[400px] bg-white border-l border-neutral-200 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">

                    <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <History className="w-4 h-4 text-neutral-600" />
                            </div>
                            <h2 className="text-sm font-black text-neutral-900 uppercase tracking-tight">
                                Registro <span className="text-emerald-600">Reciente</span>
                            </h2>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none scale-90 font-bold">En Vivo</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
                        {historial.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-neutral-400 p-10 text-center">
                                <Clock className="w-10 h-10 mb-3 opacity-20" />
                                <p className="text-[11px] font-bold uppercase tracking-widest">Esperando lecturas...</p>
                            </div>
                        ) : (
                            historial.map(log => (
                                <div key={log.asistencia_id} className="group bg-neutral-50/70 border border-neutral-100 p-4 rounded-xl flex items-center justify-between hover:bg-white hover:border-emerald-200 transition-all duration-300 hover:shadow-md hover:shadow-emerald-500/5">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shadow-sm ${
                                            log.tipo === 'E' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                        }`}>
                                            {log.tipo}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-xs text-neutral-800 uppercase tracking-tight truncate group-hover:text-emerald-700 transition-colors">
                                                {log.usuario_nombre}
                                            </p>
                                            <p className="text-[9px] font-black text-neutral-400 group-hover:text-neutral-500 uppercase tracking-widest flex items-center mt-0.5">
                                                <Clock className="w-2.5 h-2.5 mr-1" />
                                                {log.hora_entrada ? `${log.hora_entrada.substring(0,5)} (E)` : log.hora_salida ? `${log.hora_salida.substring(0,5)} (S)` : '--:--'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <History className="w-3.5 h-3.5 text-neutral-400" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-neutral-50/80 border-t border-neutral-100">
                        <Button variant="outline" className="w-full h-11 rounded-xl border-neutral-200 text-neutral-500 font-bold uppercase text-[9px] tracking-[0.2em] hover:bg-white hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm">
                            <Settings className="w-3.5 h-3.5 mr-2" /> Preferencias del Escáner
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
