import { CheckCircle, XCircle, Clock, ExternalLink, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

type Voucher = {
    id: number;
    pag_id: number;
    estado: 'pendiente' | 'validado' | 'rechazado';
    comentario: string | null;
    archivo_url: string;
    usuario: { id: number; username: string } | null;
    created_at: string;
};

type Props = {
    open:    boolean;
    onClose: () => void;
    pagId:   number | null;
};

const ESTADO_BADGE: Record<Voucher['estado'], { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    pendiente: { label: 'Pendiente', variant: 'secondary' },
    validado:  { label: 'Validado',  variant: 'default' },
    rechazado: { label: 'Rechazado', variant: 'destructive' },
};

const ESTADO_ICON: Record<Voucher['estado'], React.ReactNode> = {
    pendiente: <Clock       className="h-4 w-4 text-yellow-500" />,
    validado:  <CheckCircle className="h-4 w-4 text-green-600" />,
    rechazado: <XCircle     className="h-4 w-4 text-red-500" />,
};

export default function VoucherModal({ open, onClose, pagId }: Props) {
    const [vouchers, setVouchers]     = useState<Voucher[]>([]);
    const [loading, setLoading]       = useState(false);
    const [comentario, setComentario] = useState('');
    const [procesando, setProcesando] = useState<number | null>(null);
    const [uploading, setUploading]   = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open || !pagId) return;
        cargar();
    }, [open, pagId]);

    const cargar = () => {
        setLoading(true);
        api.get(`/pagos/${pagId}/vouchers`)
            .then(r => setVouchers(r.data.data ?? r.data))
            .finally(() => setLoading(false));
    };

    const subirVoucher = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !pagId) return;

        setUploading(true);
        setUploadError('');

        const form = new FormData();
        form.append('archivo', file);

        try {
            await api.post(`/pagos/${pagId}/vouchers`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            cargar();
        } catch (err: any) {
            setUploadError(err.response?.data?.message ?? 'Error al subir el comprobante');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const validar = async (notificaId: number, estado: 'validado' | 'rechazado') => {
        setProcesando(notificaId);
        try {
            const { data } = await api.patch(`/pagos/vouchers/${notificaId}/estado`, {
                estado,
                comentario: comentario || null,
            });
            setVouchers(prev => prev.map(v => v.id === notificaId ? data.data ?? data : v));
            setComentario('');
        } finally {
            setProcesando(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-xl w-[90vw] sm:w-full max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Comprobantes de pago</DialogTitle>
                </DialogHeader>

                {/* Subir comprobante */}
                <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-2">Subir comprobante (JPG, PNG, PDF — máx. 5MB)</p>
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="hidden"
                            onChange={subirVoucher}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={uploading}
                            onClick={() => fileRef.current?.click()}
                            className="text-xs h-8 gap-1.5"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
                        </Button>
                    </div>
                    {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
                </div>

                {loading && <p className="text-xs sm:text-sm text-muted-foreground py-4 text-center">Cargando...</p>}

                {!loading && vouchers.length === 0 && (
                    <p className="text-xs sm:text-sm text-muted-foreground py-2 text-center">
                        No hay comprobantes subidos aún.
                    </p>
                )}

                <div className="space-y-3 sm:space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {vouchers.map(v => (
                        <div key={v.id} className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    {ESTADO_ICON[v.estado]}
                                    <Badge variant={ESTADO_BADGE[v.estado].variant} className="text-xs">
                                        {ESTADO_BADGE[v.estado].label}
                                    </Badge>
                                </div>
                                <a
                                    href={v.archivo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                >
                                    Ver comprobante <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Subido por <span className="font-medium">{v.usuario?.username ?? '—'}</span>{' '}
                                el {new Date(v.created_at).toLocaleDateString('es-PE')}
                            </p>

                            {v.comentario && (
                                <p className="text-xs sm:text-sm bg-muted rounded p-2">{v.comentario}</p>
                            )}

                            {v.estado === 'pendiente' && (
                                <div className="space-y-2 pt-1">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Comentario (opcional)</Label>
                                        <Textarea
                                            rows={2}
                                            value={comentario}
                                            onChange={e => setComentario(e.target.value)}
                                            placeholder="Observación al validar o rechazar..."
                                            className="text-xs sm:text-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-xs h-8"
                                            disabled={procesando === v.id}
                                            onClick={() => validar(v.id, 'validado')}
                                        >
                                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Validar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            disabled={procesando === v.id}
                                            onClick={() => validar(v.id, 'rechazado')}
                                            className="w-full sm:w-auto text-xs h-8"
                                        >
                                            <XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
