import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, CheckCircle2, XCircle, Send, Download, Printer } from 'lucide-react';
import axios from 'axios';
import type { Pago } from '../hooks/usePago';

interface Pagador {
    id_contacto: number;
    nombres: string;
    apellidos: string;
    numero_doc: string;
}

interface ComprobanteItem {
    id: number;
    descripcion: string;
    unidad: string;
    cantidad: number;
    precio_unitario: string | number;
    subtotal: string | number;
}

interface Comprobante {
    id: number;
    tipo_documento: string;
    serie: string;
    numero: number;
    fecha_emision: string | null;
    cliente_tipo_doc: string;
    cliente_num_doc: string;
    cliente_nombre: string;
    cliente_direccion: string | null;
    op_gravada: string | number;
    igv: string | number;
    total: string | number;
    estado: string;
    nombre_archivo: string | null;
    hash: string | null;
    qr_info: string | null;
    contenido_xml: string | null;
    sunat_response: string | null;
    items?: ComprobanteItem[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    pagos: Pago[];
    pagador: Pagador;
    estudianteId: number | undefined;
    initialResult?: Comprobante;   // para abrir directamente en vista de resultado
}

export default function ComprobanteModal({ open, onClose, pagos, pagador, estudianteId, initialResult }: Props) {
    const [tipo, setTipo] = useState<'boleta' | 'factura'>('boleta');
    const [formaPago, setFormaPago] = useState<'contado' | 'credito'>('contado');
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteNumDoc, setClienteNumDoc] = useState('');
    const [clienteTipoDoc, setClienteTipoDoc] = useState<'01' | '06'>('01');
    const [clienteDireccion, setClienteDireccion] = useState('');
    const [loading, setLoading] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<Comprobante | null>(null);

    // Pre-llenar con datos del pagador cuando se abre el modal
    useEffect(() => {
        if (open) {
            setClienteNombre(`${pagador.nombres} ${pagador.apellidos}`);
            setClienteNumDoc(pagador.numero_doc ?? '');
            setClienteTipoDoc(pagador.numero_doc?.length === 11 ? '06' : '01');
            setResult(initialResult ?? null);
            setError(null);
        }
    }, [open, pagador, initialResult]);

    const total = pagos.reduce((acc, p) => acc + Number(p.pag_monto ?? 0), 0);

    const openPdf = () => {
        if (!result) return;
        // Generar token temporal y abrir PDF en nueva pestaña
        axios.post(`/api/comprobantes/${result.id}/pdf-token`)
            .then(({ data }) => {
                // Abrir PDF con token en nueva pestaña
                window.open(`/comprobantes/${result.id}/pdf?token=${data.token}`, '_blank');
            })
            .catch(error => {
                console.error('Error:', error);
                setError('Error al generar el PDF');
            });
    };

    const downloadXml = () => {
        if (!result?.contenido_xml) return;
        const blob = new Blob([result.contenido_xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.nombre_archivo ?? 'comprobante'}.xml`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadCdr = () => {
        if (!result?.sunat_response || result.estado !== 'aceptado') return;
        try {
            const clean = result.sunat_response.replace(/[\s\r\n]/g, '');
            const binary = atob(clean);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/zip' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `R-${result.nombre_archivo ?? 'cdr'}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setError('No se pudo descargar el CDR.');
        }
    };

    const handleEmitir = async () => {
        if (!clienteNombre || !clienteNumDoc) {
            setError('El nombre y número de documento del cliente son requeridos.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data } = await axios.post('/api/comprobantes', {
                tipo_documento:    tipo,
                forma_pago:        formaPago,
                cliente_tipo_doc:  clienteTipoDoc,
                cliente_num_doc:   clienteNumDoc,
                cliente_nombre:    clienteNombre,
                cliente_direccion: clienteDireccion || null,
                contacto_id:       pagador.id_contacto,
                estu_id:           estudianteId ?? null,
                pag_ids:           pagos.map(p => p.pag_id),
            });

            setResult(data.comprobante);
            router.reload({ only: ['pagos'] });
        } catch (err: any) {
            const msg = err.response?.data?.message
                ?? err.response?.data?.errors
                ?? 'Error al emitir el comprobante.';
            setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
        } finally {
            setLoading(false);
        }
    };

    const handleEnviarSunat = async () => {
        if (!result) return;
        setEnviando(true);
        setError(null);

        try {
            const { data } = await axios.post(`/api/comprobantes/${result.id}/enviar`);
            setResult(data.comprobante);
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Error al enviar a SUNAT.');
        } finally {
            setEnviando(false);
        }
    };

    const estadoBadge = (estado: string) => {
        const map: Record<string, string> = {
            borrador:  'bg-gray-100 text-gray-600',
            generado:  'bg-blue-100 text-blue-700',
            enviado:   'bg-yellow-100 text-yellow-700',
            aceptado:  'bg-green-100 text-green-700',
            rechazado: 'bg-red-100 text-red-700',
            anulado:   'bg-orange-100 text-orange-700',
        };
        return map[estado] ?? 'bg-gray-100 text-gray-600';
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold">
                        <FileText className="size-5 text-blue-600" />
                        Emitir Comprobante Electrónico
                    </DialogTitle>
                </DialogHeader>

                {!result ? (
                    <div className="space-y-4 py-2">
                        {/* Pagos incluidos */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Pagos incluidos ({pagos.length})
                            </p>
                            {pagos.map(p => (
                                <div key={p.pag_id} className="flex justify-between text-sm">
                                    <span className="text-gray-700">
                                        {p.concepto_nombre || 'Servicio'}
                                        {p.pag_mes ? ` — ${p.pag_mes} ${p.pag_anual}` : ` — ${p.pag_anual}`}
                                    </span>
                                    <span className="font-semibold text-blue-600">
                                        S/ {Number(p.pag_monto ?? 0).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-sm">
                                <span>Total</span>
                                <span className="text-blue-700">S/ {total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Tipo de documento */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Tipo de comprobante</Label>
                                <Select value={tipo} onValueChange={v => setTipo(v as 'boleta' | 'factura')}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="boleta">Boleta</SelectItem>
                                        <SelectItem value="factura">Factura</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Forma de pago</Label>
                                <Select value={formaPago} onValueChange={v => setFormaPago(v as 'contado' | 'credito')}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="contado">Contado</SelectItem>
                                        <SelectItem value="credito">Crédito</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Datos del cliente */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Datos del cliente
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Tipo de documento</Label>
                                    <Select value={clienteTipoDoc} onValueChange={v => setClienteTipoDoc(v as '01' | '06')}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="01">DNI</SelectItem>
                                            <SelectItem value="06">RUC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Número de documento</Label>
                                    <Input
                                        className="h-9 text-sm"
                                        value={clienteNumDoc}
                                        onChange={e => setClienteNumDoc(e.target.value)}
                                        maxLength={11}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Nombre / Razón social</Label>
                                <Input
                                    className="h-9 text-sm"
                                    value={clienteNombre}
                                    onChange={e => setClienteNombre(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Dirección (opcional)</Label>
                                <Input
                                    className="h-9 text-sm"
                                    value={clienteDireccion}
                                    onChange={e => setClienteDireccion(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                                {error}
                            </p>
                        )}
                    </div>
                ) : (
                    // Resultado después de emitir
                    <div className="py-2 space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                            {result.estado === 'aceptado'
                                ? <CheckCircle2 className="size-8 text-green-600 shrink-0" />
                                : result.estado === 'rechazado'
                                    ? <XCircle className="size-8 text-red-600 shrink-0" />
                                    : <FileText className="size-8 text-blue-600 shrink-0" />
                            }
                            <div>
                                <p className="font-bold text-gray-800">
                                    {result.tipo_documento === 'boleta' ? 'Boleta' : 'Factura'}{' '}
                                    {result.serie}-{result.numero}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Total: <strong className="text-blue-700">S/ {Number(result.total).toFixed(2)}</strong>
                                </p>
                            </div>
                            <Badge className={`ml-auto ${estadoBadge(result.estado)}`} variant="outline">
                                {result.estado.toUpperCase()}
                            </Badge>
                        </div>

                        {result.nombre_archivo && (
                            <div className="text-xs space-y-1 text-gray-600 bg-gray-50 rounded-lg p-3">
                                <p><span className="font-medium">Archivo:</span> {result.nombre_archivo}</p>
                                {result.hash && <p><span className="font-medium">Hash:</span> {result.hash}</p>}
                                {result.qr_info && <p><span className="font-medium">QR:</span> {result.qr_info}</p>}
                            </div>
                        )}

                        {/* Botones de descarga */}
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openPdf}
                                className="h-8 text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                                <Printer className="size-3.5" />
                                Ver PDF
                            </Button>
                            {result.contenido_xml && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadXml}
                                    className="h-8 text-xs gap-1.5"
                                >
                                    <Download className="size-3.5" />
                                    Descargar XML
                                </Button>
                            )}
                            {result.estado === 'aceptado' && result.sunat_response && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadCdr}
                                    className="h-8 text-xs gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                                >
                                    <Download className="size-3.5" />
                                    Descargar CDR
                                </Button>
                            )}
                        </div>

                        {result.sunat_response && result.estado === 'rechazado' && (
                            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                                {result.sunat_response}
                            </p>
                        )}

                        {result.estado === 'generado' && (
                            <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg p-3">
                                El comprobante fue generado y firmado. Puedes enviarlo a SUNAT ahora o más tarde.
                            </p>
                        )}

                        {error && (
                            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                                {error}
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} className="text-xs h-9">
                        Cerrar
                    </Button>

                    {!result ? (
                        <Button
                            onClick={handleEmitir}
                            disabled={loading || pagos.length === 0}
                            className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            {loading && <Loader2 className="size-4 animate-spin" />}
                            Emitir Comprobante
                        </Button>
                    ) : result.estado === 'generado' ? (
                        <Button
                            onClick={handleEnviarSunat}
                            disabled={enviando}
                            className="h-9 text-xs bg-[#00a65a] hover:bg-[#008d4c] text-white gap-2"
                        >
                            {enviando
                                ? <Loader2 className="size-4 animate-spin" />
                                : <Send className="size-4" />
                            }
                            Enviar a SUNAT
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
