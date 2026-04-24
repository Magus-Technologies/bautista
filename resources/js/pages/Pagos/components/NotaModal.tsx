import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, FileText } from 'lucide-react';
import AlertModal from '@/components/shared/AlertModal';
import axios from 'axios';

interface Comprobante {
    id: number;
    tipo_documento: string;
    serie: string;
    numero: string;
    cliente_nombre: string;
    cliente_num_doc: string;
    total: number;
    moneda: string;
}

interface TipoNota {
    value: string;
    label: string;
    descripcion: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    comprobante: Comprobante | null;
    tipo: 'credito' | 'debito';
    onSuccess: () => void;
}

export default function NotaModal({ open, onClose, comprobante, tipo, onSuccess }: Props) {
    const [tiposNota, setTiposNota] = useState<TipoNota[]>([]);
    const [tipoNota, setTipoNota] = useState('');
    const [motivo, setMotivo] = useState('');
    const [monto, setMonto] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingTipos, setLoadingTipos] = useState(false);

    // Estado para AlertModal
    const [alertModal, setAlertModal] = useState<{
        open: boolean;
        variant: 'success' | 'error' | 'warning' | 'info';
        title?: string;
        message: string;
    }>({
        open: false,
        variant: 'info',
        message: ''
    });

    // Cargar tipos de nota al abrir
    useEffect(() => {
        if (open && comprobante) {
            loadTiposNota();
            // Reset form
            setTipoNota('');
            setMotivo('');
            setMonto('');
        }
    }, [open, tipo, comprobante]);

    // Auto-llenar monto cuando se selecciona anulación o devolución total
    useEffect(() => {
        if (comprobante && tipoNota) {
            // Tipos que requieren monto total automático
            const tiposTotales = ['01', '02', '06']; // Anulación operación, Error RUC, Devolución total
            
            if (tiposTotales.includes(tipoNota)) {
                setMonto(comprobante.total.toString());
            } else if (monto === comprobante.total.toString()) {
                // Si cambia de tipo total a parcial, limpiar el monto
                setMonto('');
            }
        }
    }, [tipoNota, comprobante]);

    const loadTiposNota = async () => {
        const endpoint = tipo === 'credito' 
            ? '/api/comprobantes/tipos-nota-credito'
            : '/api/comprobantes/tipos-nota-debito';
        
        try {
            setLoadingTipos(true);
            const { data } = await axios.get(endpoint);
            setTiposNota(data);
        } catch (error) {
            console.error('Error cargando tipos de nota:', error);
            setAlertModal({
                open: true,
                variant: 'error',
                message: 'Error al cargar tipos de nota'
            });
        } finally {
            setLoadingTipos(false);
        }
    };

    const handleSubmit = async () => {
        if (!comprobante) return;

        // Validaciones
        if (!tipoNota) {
            setAlertModal({
                open: true,
                variant: 'warning',
                message: 'Debe seleccionar el tipo de nota'
            });
            return;
        }
        if (!motivo.trim()) {
            setAlertModal({
                open: true,
                variant: 'warning',
                message: 'Debe ingresar el motivo de la nota'
            });
            return;
        }
        if (!monto || parseFloat(monto) <= 0) {
            setAlertModal({
                open: true,
                variant: 'warning',
                message: 'Debe ingresar un monto válido'
            });
            return;
        }

        const endpoint = tipo === 'credito'
            ? '/api/comprobantes/nota-credito'
            : '/api/comprobantes/nota-debito';

        const payload = {
            comprobante_referencia_id: comprobante.id,
            tipo_nota: tipoNota,
            motivo_nota: motivo.trim(),
            total: parseFloat(monto),
            items: [{
                cod_producto: tipo === 'credito' ? `NC-${tipoNota}` : `ND-${tipoNota}`,
                descripcion: motivo.trim(),
                cantidad: 1,
                precio: parseFloat(monto)
            }]
        };

        try {
            setLoading(true);
            await axios.post(endpoint, payload);
            setAlertModal({
                open: true,
                variant: 'success',
                message: `Nota de ${tipo === 'credito' ? 'crédito' : 'débito'} emitida correctamente`
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error al emitir nota:', error);
            const mensaje = error.response?.data?.message || 'Error al emitir la nota';
            setAlertModal({
                open: true,
                variant: 'error',
                message: mensaje
            });
        } finally {
            setLoading(false);
        }
    };

    if (!comprobante) return null;

    const tipoLabel = tipo === 'credito' ? 'Crédito' : 'Débito';
    const tipoColor = tipo === 'credito' ? 'text-orange-600' : 'text-blue-600';
    const tipoBg = tipo === 'credito' ? 'bg-orange-50' : 'bg-blue-50';
    const tipoBorder = tipo === 'credito' ? 'border-orange-200' : 'border-blue-200';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${tipoColor}`}>
                        <FileText className="size-5" />
                        Emitir Nota de {tipoLabel}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Info del comprobante original */}
                    <div className={`${tipoBg} border ${tipoBorder} rounded-lg p-4`}>
                        <div className="flex items-start gap-3">
                            <AlertCircle className={`size-5 ${tipoColor} mt-0.5`} />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 mb-2">
                                    Documento que se va a modificar:
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">Tipo:</span>
                                        <span className="ml-2 font-medium">
                                            {comprobante.tipo_documento === 'boleta' ? 'Boleta' : 'Factura'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Número:</span>
                                        <span className="ml-2 font-mono font-bold">
                                            {comprobante.serie}-{comprobante.numero}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-600">Cliente:</span>
                                        <span className="ml-2 font-medium">{comprobante.cliente_nombre}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Documento:</span>
                                        <span className="ml-2 font-mono">{comprobante.cliente_num_doc}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Total:</span>
                                        <span className="ml-2 font-bold text-blue-600">
                                            S/ {Number(comprobante.total).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Formulario */}
                    <div className="space-y-4">
                        {/* Tipo de Nota */}
                        <div className="space-y-2">
                            <Label htmlFor="tipo_nota" className="text-sm font-semibold">
                                Tipo de Nota <span className="text-red-500">*</span>
                            </Label>
                            {loadingTipos ? (
                                <div className="text-sm text-gray-500">Cargando tipos...</div>
                            ) : (
                                <select
                                    id="tipo_nota"
                                    value={tipoNota}
                                    onChange={(e) => setTipoNota(e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                >
                                    <option value="">Seleccione el tipo de nota...</option>
                                    {tiposNota.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {tipoNota && tiposNota.find(t => t.value === tipoNota) && (
                                <p className="text-xs text-gray-600 italic">
                                    {tiposNota.find(t => t.value === tipoNota)?.descripcion}
                                </p>
                            )}
                        </div>

                        {/* Motivo */}
                        <div className="space-y-2">
                            <Label htmlFor="motivo" className="text-sm font-semibold">
                                Motivo de la Nota <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="motivo"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Describa detalladamente el motivo de la nota..."
                                className="text-sm resize-none"
                                rows={3}
                                maxLength={500}
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-500 text-right">
                                {motivo.length}/500 caracteres
                            </p>
                        </div>

                        {/* Monto */}
                        <div className="space-y-2">
                            <Label htmlFor="monto" className="text-sm font-semibold">
                                Monto <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                    S/
                                </span>
                                <Input
                                    id="monto"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-10 text-sm"
                                    disabled={loading || ['01', '02', '06'].includes(tipoNota)}
                                />
                            </div>
                            {['01', '02', '06'].includes(tipoNota) && (
                                <p className="text-xs text-blue-600 flex items-center gap-1">
                                    <AlertCircle className="size-3" />
                                    {tipoNota === '01' && 'Anulación total: el monto es automáticamente el total del comprobante'}
                                    {tipoNota === '02' && 'Anulación por error en RUC: el monto es automáticamente el total del comprobante'}
                                    {tipoNota === '06' && 'Devolución total: el monto es automáticamente el total del comprobante'}
                                </p>
                            )}
                            {tipo === 'credito' && monto && parseFloat(monto) > comprobante.total && !['01', '02', '06'].includes(tipoNota) && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="size-3" />
                                    El monto no puede ser mayor al total del comprobante
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || loadingTipos}
                        className={tipo === 'credito' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}
                    >
                        {loading ? 'Emitiendo...' : `Emitir Nota de ${tipoLabel}`}
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Alert Modal */}
            <AlertModal
                open={alertModal.open}
                onClose={() => setAlertModal({ ...alertModal, open: false })}
                variant={alertModal.variant}
                title={alertModal.title}
                message={alertModal.message}
            />
        </Dialog>
    );
}
