import { Head } from '@inertiajs/react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Shield, Clock, UserCheck, AlertCircle, History, Zap, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Asistencia',    href: '/asistencia' },
    { title: 'Escáner QR', href: '/asistencia/scanner' },
];
export default function AsistenciaScanner() {
    const [lastScan, setLastScan] = useState<any>(null);
    const [historial, setHistorial] = useState<any[]>([]);
    const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [isSecure, setIsSecure] = useState(true);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const tipoRef = useRef(tipo);
    const scanningRef = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsSecure(window.isSecureContext);
        }
    }, []);

    useEffect(() => {
        tipoRef.current = tipo;
        scanningRef.current = scanning;
    }, [tipo, scanning]);

    useEffect(() => {
        loadHistorial();
        
        if (!scannerRef.current && window.isSecureContext) {
            scannerRef.current = new Html5QrcodeScanner(
                "reader", 
                { 
                    fps: 20, 
                    qrbox: { width: 450, height: 350 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                    showZoomSliderIfSupported: true,
                }, 
                /* verbose= */ false
            );
            scannerRef.current.render(onScanSuccess, onScanFailure);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
                scannerRef.current = null;
            }
        };
    }, []);

    const loadHistorial = () => {
        api.get('/asistencia/historial').then(res => setHistorial(res.data));
    };

    function onScanSuccess(decodedText: string) {
        if (scanningRef.current) {
return;
}

        setScanning(true);
        api.post('/asistencia/marcar-qr', { qr_data: decodedText, tipo_marcado: tipoRef.current })
            .then(res => {
                setLastScan(res.data);
                setError(null);
                loadHistorial();
            })
            .catch(err => {
                setError(err.response?.data?.message || "Error al procesar QR");
            })
            .finally(() => {
                setTimeout(() => setScanning(false), 2000);
            });
    }

    function onScanFailure(error: any) {
        // quiet fail
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Escáner QR - Asistencia" />
            
            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-neutral-50/50">
                
                {/* ── Lado Izquierdo: Lector ──────────────────────────────── */}
                <div className="flex-1 p-6 md:p-10 flex flex-col space-y-8">
                    
                    {/* Header Estándar ERP */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <QrCode className="h-5 w-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Control de Asistencia</span>
                        </div>
                        <h1 className="text-3xl font-black text-neutral-950 tracking-tight">
                            Escáner de <span className="text-emerald-600">Asistencia</span>
                        </h1>
                        <p className="text-neutral-500 text-sm font-medium">
                            Aproxime el código QR de su carnet a la cámara para registrar su asistencia.
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-start py-8">
                        
                        {/* Contenedor del Lector QR - Ajustado a tamaño XL */}
                        <div className="w-full max-w-2xl space-y-10">
                            
                            {/* Selector de Tipo (Entrada/Salida) */}
                            <div className="bg-white border border-neutral-200 p-1.5 rounded-2xl shadow-sm flex gap-1.5 max-w-sm mx-auto">
                                <button 
                                    type="button"
                                    onClick={() => setTipo('entrada')}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                        tipo === 'entrada' 
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                                        : 'text-neutral-400 hover:bg-neutral-50'
                                    }`}
                                >
                                    <Zap className={`w-3.5 h-3.5 ${tipo === 'entrada' ? 'fill-white' : ''}`} />
                                    Entrada
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setTipo('salida')}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                        tipo === 'salida' 
                                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' 
                                        : 'text-neutral-400 hover:bg-neutral-50'
                                    }`}
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    Salida
                                </button>
                            </div>

                            {/* El Scanner frame - Tamaño XL */}
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
                                                    El acceso a la cámara requiere una conexión <span className="font-black">HTTPS</span> por seguridad. 
                                                    Contacte al administrador para habilitar el certificado SSL.
                                                </p>
                                            </div>
                                            <div className="pt-4 w-full">
                                                <div className="bg-white/50 border border-thin border-rose-200 p-3 rounded-lg text-left">
                                                    <p className="text-[10px] text-rose-800 font-bold uppercase mb-1">Causa técnica:</p>
                                                    <code className="text-[9px] text-rose-600 font-mono break-all">DOMException: Permission denied (Secure Context Required)</code>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div id="reader" className="w-full h-full overflow-hidden rounded-xl border border-neutral-100" />
                                            
                                            {/* Overlay al escanear */}
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

                            {/* Feedback de resultado */}
                            <div className="min-h-[100px] max-w-xl mx-auto w-full">
                                {lastScan && (
                                    <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center space-x-4 animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                                            <UserCheck className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-emerald-800 tracking-tight uppercase">Registro Exitoso</h3>
                                            <p className="text-emerald-600 font-bold text-[11px] uppercase tracking-wide leading-tight">{lastScan.message}</p>
                                            <p className="text-neutral-500 text-[10px] font-medium mt-0.5 tracking-wider italic">Turno: {lastScan.turno === 'M' ? 'Mañana' : 'Tarde'}</p>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-center space-x-4 animate-in shake duration-500">
                                        <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center shadow-md shadow-rose-500/20">
                                            <AlertCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-rose-800 tracking-tight uppercase">Error de Lectura</h3>
                                            <p className="text-rose-600 font-bold text-[11px] uppercase tracking-wide leading-tight">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Lado Derecho: Historial Reciente ─────────────────────── */}
                <div className="w-full lg:w-[400px] bg-white border-l border-neutral-200 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
                    
                    <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <History className="w-4 h-4 text-neutral-600" />
                            </div>
                            <h2 className="text-sm font-black text-neutral-900 uppercase tracking-tight">Registro <span className="text-emerald-600">Reciente</span></h2>
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
                                            log.tipo === 'E' 
                                            ? 'bg-emerald-500 text-white' 
                                            : 'bg-rose-500 text-white'
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

