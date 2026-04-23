import { useEffect, useState } from 'react';
import FormField from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Pago, PagoFormData } from '../hooks/usePago';
import { MESES } from '../hooks/usePago';
import api from '@/lib/api';
import { Loader2, Sparkles } from 'lucide-react';

export type { PagoFormData };

type Concepto = {
    concepto_id:  number;
    nombre:       string;
    periodicidad: 'mensual' | 'anual' | 'unico';
    opcional:     boolean;
};

type Props = {
    open:         boolean;
    onClose:      () => void;
    contactoId:   number;
    estudianteId: number;
    editing:      Pago | null;
    onSave:       (data: PagoFormData) => Promise<void>;
    apiErrors:    Record<string, string[]>;
    clearErrors:  () => void;
};

const blank = (contactoId?: number, estudianteId?: number): PagoFormData => ({
    contacto_id:   contactoId?.toString() || '',
    estudiante_id: estudianteId?.toString() || '',
    concepto_id:   '',
    pag_anual:     new Date().getFullYear().toString(),
    pag_mes:       MESES[new Date().getMonth()],
    pag_monto:     '',
    pag_notifica:  'NO',
    pag_fecha:     new Date().toISOString().slice(0, 10),
    // legacy — vacíos por defecto
    pag_nombre1:   '',
    pag_otro1:     '',
    pag_nombre2:   '',
    pag_otro2:     '',
});

const fromPago = (pago: Pago): PagoFormData => ({
    contacto_id:   (pago.contacto_id ?? '').toString(),
    estudiante_id: (pago.estudiante_id ?? '').toString(),
    concepto_id:   pago.concepto_id?.toString() ?? '',
    pag_anual:     (pago.pag_anual ?? new Date().getFullYear()).toString(),
    pag_mes:       pago.pag_mes ?? MESES[new Date().getMonth()],
    pag_monto:     pago.pag_monto ?? '',
    pag_notifica:  pago.pag_notifica ?? 'NO',
    pag_fecha:     pago.pag_fecha ?? '',
    pag_nombre1:   pago.pag_nombre1 ?? '',
    pag_otro1:     pago.pag_otro1 ?? '',
    pag_nombre2:   pago.pag_nombre2 ?? '',
    pag_otro2:     pago.pag_otro2 ?? '',
});

export default function PagoFormModal({
    open, onClose, contactoId, estudianteId,
    editing, onSave, apiErrors, clearErrors,
}: Props) {
    const [form, setForm]               = useState<PagoFormData>(blank(contactoId, estudianteId));
    const [processing, setProc]         = useState(false);
    const [conceptos, setConceptos]     = useState<Concepto[]>([]);
    const [loadingSugerido, setLoadingSugerido] = useState(false);
    const [sugerido, setSugerido]       = useState<{ monto_final: number; observacion: string | null } | null>(null);
    const [pagosExistentes, setPagosExistentes] = useState<Pago[]>([]);

    // Concepto seleccionado actualmente
    const conceptoSeleccionado = conceptos.find(c => c.concepto_id.toString() === form.concepto_id);
    const esMensual = conceptoSeleccionado?.periodicidad === 'mensual';

    // Validar restricción de conceptos únicos
    const validacionConceptoUnico = (() => {
        if (!conceptoSeleccionado || editing) return null;

        // Si el concepto es único
        if (conceptoSeleccionado.periodicidad === 'unico') {
            // Verificar si hay otros pagos del mismo año
            const otrosPagos = pagosExistentes.filter(p => 
                p.pag_anual.toString() === form.pag_anual && 
                p.concepto_id !== conceptoSeleccionado.concepto_id
            );
            if (otrosPagos.length > 0) {
                return 'No se puede agregar un concepto único si ya hay otros pagos. Los conceptos únicos son excluyentes.';
            }
        } else {
            // Si el concepto NO es único, verificar si hay concepto único existente
            const conceptoUnicoExistente = pagosExistentes.find(p => {
                const c = conceptos.find(x => x.concepto_id === p.concepto_id);
                return c?.periodicidad === 'unico' && p.pag_anual.toString() === form.pag_anual;
            });
            if (conceptoUnicoExistente) {
                return 'No se puede agregar más pagos. Ya existe un concepto único que es excluyente.';
            }
        }
        return null;
    })();

    useEffect(() => {
        if (open) {
            clearErrors();
            setForm(editing ? fromPago(editing) : blank(contactoId, estudianteId));
            fetchConceptos();
            fetchPagosExistentes();
        }
    }, [open, editing, estudianteId]);

    const fetchPagosExistentes = async () => {
        if (!contactoId) return;
        try {
            const { data } = await api.get(`/pagos/contactos/${contactoId}`);
            setPagosExistentes(data.data ?? data);
        } catch (err) {
            console.error('Error al cargar pagos existentes:', err);
        }
    };

    // Refrescar monto sugerido al cambiar año (solo en creación)
    useEffect(() => {
        if (open && !editing && form.pag_anual) {
            fetchSugerido();
        }
    }, [form.pag_anual, estudianteId, open]);

    const fetchConceptos = async () => {
        if (!estudianteId) return;
        try {
            const { data } = await api.get<Concepto[]>('/conceptos-pago/');
            setConceptos(data);
        } catch (err) {
            console.error('Error al cargar conceptos:', err);
        }
    };

    const fetchSugerido = async () => {
        setLoadingSugerido(true);
        try {
            const { data } = await api.get(`/pagos/sugerido/${estudianteId}`, {
                params: { anio: form.pag_anual },
            });
            setSugerido(data);
            if (!editing && (!form.pag_monto || form.pag_monto === '0')) {
                set('pag_monto', data.monto_final.toString());
            }
        } catch (err) {
            console.error('Error al cargar sugerido:', err);
        } finally {
            setLoadingSugerido(false);
        }
    };

    // Al seleccionar un concepto, pre-llenar monto desde sugerido si es mensual
    const handleConceptoChange = (value: string) => {
        set('concepto_id', value);
        const c = conceptos.find(x => x.concepto_id.toString() === value);
        if (c?.periodicidad === 'mensual' && sugerido) {
            set('pag_monto', sugerido.monto_final.toString());
        }
    };

    const set = (key: keyof PagoFormData, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const err = (key: string) => apiErrors[key]?.[0];

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        setProc(true);
        try {
            await onSave(form);
            onClose();
        } finally {
            setProc(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg w-[90vw] sm:w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">
                        {editing ? 'Editar Pago' : 'Registrar Pago'}
                    </DialogTitle>

                    {/* Tarifa sugerida — solo en creación */}
                    {!editing && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-blue-700 flex items-center gap-1">
                                    <Sparkles className="size-3" />
                                    Tarifa mensual configurada ({form.pag_anual}):
                                </p>
                                {loadingSugerido ? (
                                    <Loader2 className="size-3 animate-spin text-blue-500" />
                                ) : (
                                    <span className="font-bold text-blue-800">
                                        S/ {sugerido?.monto_final.toFixed(2) ?? '0.00'}
                                    </span>
                                )}
                            </div>
                            {sugerido?.observacion && (
                                <p className="text-[10px] text-blue-600 mt-1 italic">{sugerido.observacion}</p>
                            )}
                        </div>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-2">

                    {/* Concepto de pago */}
                    <div className="space-y-1">
                        <Label className="text-xs sm:text-sm">Concepto de pago *</Label>
                        <Select
                            value={form.concepto_id || '__none__'}
                            onValueChange={(v) => handleConceptoChange(v === '__none__' ? '' : v)}
                        >
                            <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                                <SelectValue placeholder="Seleccionar concepto..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">— Sin concepto —</SelectItem>
                                {conceptos.map(c => (
                                    <SelectItem key={c.concepto_id} value={c.concepto_id.toString()}>
                                        {c.nombre}
                                        {c.periodicidad === 'unico' && (
                                            <span className="ml-2 text-red-600 font-bold">●</span>
                                        )}
                                        <span className="ml-2 text-[10px] text-gray-400 capitalize">
                                            ({c.periodicidad})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {err('concepto_id') && <p className="text-xs text-red-500">{err('concepto_id')}</p>}
                        {validacionConceptoUnico && (
                            <p className="text-xs text-red-500 flex items-start gap-1">
                                <span>⚠️</span>
                                <span>{validacionConceptoUnico}</span>
                            </p>
                        )}
                    </div>

                    {/* Año y Mes — solo en creación */}
                    {!editing && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs sm:text-sm">Año *</Label>
                                <Select value={form.pag_anual} onValueChange={(v) => set('pag_anual', v)}>
                                    <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026, 2027].map((y) => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {err('pag_anual') && <p className="text-xs text-red-500">{err('pag_anual')}</p>}
                            </div>

                            {/* Mes — solo si el concepto es mensual o no hay concepto seleccionado */}
                            {(!conceptoSeleccionado || esMensual) && (
                                <div className="space-y-1">
                                    <Label className="text-xs sm:text-sm">Mes *</Label>
                                    <Select value={form.pag_mes} onValueChange={(v) => set('pag_mes', v)}>
                                        <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MESES.map((m) => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {err('pag_mes') && <p className="text-xs text-red-500">{err('pag_mes')}</p>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Monto */}
                    <FormField
                        label="Monto (S/) *"
                        type="number"
                        value={form.pag_monto}
                        onChange={(v) => set('pag_monto', v)}
                        error={err('pag_monto')}
                        placeholder="0.00"
                    />

                    {/* Notificado + Fecha */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs sm:text-sm">Notificado</Label>
                            <Select value={form.pag_notifica} onValueChange={(v) => set('pag_notifica', v)}>
                                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NO">NO</SelectItem>
                                    <SelectItem value="SI">SI</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <FormField
                            label="Fecha de pago"
                            type="date"
                            value={form.pag_fecha}
                            onChange={(v) => set('pag_fecha', v)}
                            error={err('pag_fecha')}
                        />
                    </div>

                    <DialogFooter className="gap-2 flex-col-reverse sm:flex-row pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !!validacionConceptoUnico}
                            title={validacionConceptoUnico ? 'No se puede guardar: ' + validacionConceptoUnico : ''}
                            className="bg-[#00a65a] hover:bg-[#008d4c] text-white w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
