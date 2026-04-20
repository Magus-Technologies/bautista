import axios from 'axios';
import { Upload, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type Voucher = {
    id: number;
    estado: 'pendiente' | 'validado' | 'rechazado';
    comentario: string | null;
    archivo_url: string;
    created_at: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    pagId: number | null;
    mes: string;
};

const ESTADO_CONFIG: Record<Voucher['estado'], { label: string; icon: React.ReactNode; color: string }> = {
    pendiente:  { label: 'En revisión',  icon: <Clock className="h-4 w-4" />,        color: 'text-yellow-600' },
    validado:   { label: 'Validado',     icon: <CheckCircle className="h-4 w-4" />,  color: 'text-green-600' },
    rechazado:  { label: 'Rechazado',    icon: <XCircle className="h-4 w-4" />,      color: 'text-red-500' },
};

export default function SubirVoucherModal({ open, onClose, pagId, mes }: Props) {
    const inputRef              = useRef<HTMLInputElement>(null);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [subiendo, setSubiendo] = useState(false);
    const [error, setError]     = useState('');
    const [loaded, setLoaded]   = useState(false);

    const cargarVouchers = async () => {
        if (!pagId) {
return;
}

        const { data } = await axios.get(`/api/pagos/${pagId}/vouchers`);
        setVouchers(data.data ?? data);
        setLoaded(true);
    };

    const handleOpen = (isOpen: boolean) => {
        if (isOpen && !loaded) {
cargarVouchers();
}

        if (!isOpen) {
            onClose();
            setArchivo(null);
            setError('');
            setLoaded(false);
        }
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];

        if (!f) {
return;
}

        if (f.size > 5 * 1024 * 1024) {
 setError('El archivo no puede superar 5 MB.');

 return; 
}

        setArchivo(f);
        setError('');
    };

    const handleSubir = async () => {
        if (!archivo || !pagId) {
return;
}

        setSubiendo(true);
        setError('');

        try {
            const form = new FormData();
            form.append('archivo', archivo);
            const { data } = await axios.post(`/api/pagos/${pagId}/vouchers`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setVouchers(prev => [data.data ?? data, ...prev]);
            setArchivo(null);

            if (inputRef.current) {
inputRef.current.value = '';
}
        } catch (e: any) {
            setError(e.response?.data?.message ?? 'Error al subir el comprobante.');
        } finally {
            setSubiendo(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Comprobante de pago — {mes}</DialogTitle>
                </DialogHeader>

                {/* Warning: pending voucher already exists */}
                {vouchers.some(v => v.estado === 'pendiente') && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <span>Ya existe un comprobante <strong>en revisión</strong> para este pago. Puedes enviar otro si es necesario.</span>
                    </div>
                )}

                {/* Historial de vouchers */}
                {vouchers.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Comprobantes enviados
                        </p>
                        {vouchers.map(v => {
                            const cfg = ESTADO_CONFIG[v.estado];

                            return (
                                <div key={v.id} className="flex items-center justify-between border rounded p-2 text-sm">
                                    <a
                                        href={v.archivo_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline truncate max-w-[180px]"
                                    >
                                        {new Date(v.created_at).toLocaleDateString('es-PE')}
                                    </a>
                                    <span className={`flex items-center gap-1 font-medium ${cfg.color}`}>
                                        {cfg.icon} {cfg.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Upload */}
                <div className="space-y-2">
                    <Label>Subir nuevo comprobante</Label>
                    <p className="text-xs text-muted-foreground">
                        Formatos permitidos: JPG, PNG, PDF · Máx. 5 MB
                    </p>
                    <div
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => inputRef.current?.click()}
                    >
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        {archivo
                            ? <p className="text-sm font-medium">{archivo.name}</p>
                            : <p className="text-sm text-muted-foreground">Haz clic para seleccionar</p>
                        }
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={handleFile}
                    />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button
                        disabled={!archivo || subiendo}
                        onClick={handleSubir}
                        className="bg-[#00a65a] hover:bg-[#008d4c] text-white"
                    >
                        {subiendo ? 'Subiendo...' : 'Enviar comprobante'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
