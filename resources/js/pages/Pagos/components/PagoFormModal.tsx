import { useEffect, useState } from 'react';
import FormField from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Pago } from '../hooks/usePago';
import { MESES } from '../hooks/usePago';
import api from '@/lib/api';
import { Loader2, Sparkles } from 'lucide-react';

export type PagoFormData = {
    contacto_id:   string;
    estudiante_id: string;
    pag_anual:     string;
    pag_mes:       string;
    pag_monto:     string;
    pag_nombre1:   string;
    pag_otro1:     string;
    pag_nombre2:   string;
    pag_otro2:     string;
    pag_notifica:  string;
    pag_fecha:     string;
};

type Concepto = {
    concepto_id: number;
    nombre: string;
    opcional: boolean;
};

type Props = {
    open:          boolean;
    onClose:       () => void;
    contactoId:    number;
    estudianteId:  number;
    mensualidad:   string | null;
    editing:       Pago | null;
    onSave:        (data: PagoFormData) => Promise<void>;
    apiErrors:     Record<string, string[]>;
    clearErrors:   () => void;
};

const blank = (contactoId: number, estudianteId: number): PagoFormData => ({
    contacto_id:   contactoId.toString(),
    estudiante_id: estudianteId.toString(),
    pag_anual:     new Date().getFullYear().toString(),
    pag_mes:       MESES[new Date().getMonth()],
    pag_monto:     '',
    pag_nombre1:   '',
    pag_otro1:     '',
    pag_nombre2:   '',
    pag_otro2:     '',
    pag_notifica:  'NO',
    pag_fecha:     new Date().toISOString().slice(0, 10),
});

const fromPago = (pago: Pago): PagoFormData => ({
    contacto_id:   (pago.contacto_id ?? '').toString(),
    estudiante_id: (pago.estudiante_id ?? '').toString(),
    pag_anual:     (pago.pag_anual ?? new Date().getFullYear()).toString(),
    pag_mes:       pago.pag_mes ?? MESES[new Date().getMonth()],
    pag_monto:     pago.pag_monto ?? '',
    pag_nombre1:   pago.pag_nombre1 ?? '',
    pag_otro1:     pago.pag_otro1 ?? '',
    pag_nombre2:   pago.pag_nombre2 ?? '',
    pag_otro2:     pago.pag_otro2 ?? '',
    pag_notifica:  pago.pag_notifica ?? 'NO',
    pag_fecha:     pago.pag_fecha ?? '',
});

export default function PagoFormModal({
    open, onClose, contactoId, estudianteId, mensualidad,
    editing, onSave, apiErrors, clearErrors,
}: Props) {
    const [form, setForm]       = useState<PagoFormData>(blank(contactoId, estudianteId));
    const [processing, setProc] = useState(false);
    const [conceptos, setConceptos] = useState<Concepto[]>([]);
    const [loadingSugerido, setLoadingSugerido] = useState(false);
    const [sugerido, setSugerido] = useState<{ monto_final: number; observacion: string | null } | null>(null);

    useEffect(() => {
        if (open) {
            clearErrors();
            setForm(editing ? fromPago(editing) : blank(contactoId, estudianteId));
            fetchConceptos();
        }
    }, [open, editing, estudianteId]);

    useEffect(() => {
        if (open && !editing && form.pag_anual) {
            fetchSugerido();
        }
    }, [form.pag_anual, form.pag_mes, estudianteId, open]);

    const fetchConceptos = async () => {
        if (!estudianteId) return;
        try {
            const { data } = await api.get(`/conceptos-pago/estudiante/${estudianteId}`);
            setConceptos(data);
        } catch (err) {
            console.error('Error al cargar conceptos:', err);
        }
    };

    const fetchSugerido = async () => {
        setLoadingSugerido(true);
        try {
            const { data } = await api.get(`/pagos/sugerido/${estudianteId}`, {
                params: { anio: form.pag_anual }
            });
            setSugerido(data);
            // Si es un registro nuevo, auto-llenar el monto si está vacío
            if (!editing && (!form.pag_monto || form.pag_monto === '0')) {
                set('pag_monto', data.monto_final.toString());
            }
        } catch (err) {
            console.error('Error al cargar sugerido:', err);
        } finally {
            setLoadingSugerido(false);
        }
    };

    const set = (key: keyof PagoFormData, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

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
                    {!editing && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-blue-700 flex items-center gap-1">
                                    <Sparkles className="size-3" />
                                    Tarifa configurada ({form.pag_anual}):
                                </p>
                                {loadingSugerido ? (
                                    <Loader2 className="size-3 animate-spin text-blue-500" />
                                ) : (
                                    <span className="font-bold text-blue-800">S/ {sugerido?.monto_final.toFixed(2) ?? '0.00'}</span>
                                )}
                            </div>
                            {sugerido?.observacion && (
                                <p className="text-[10px] text-blue-600 mt-1 italic">{sugerido.observacion}</p>
                            )}
                        </div>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-2">
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
                        </div>
                    )}

                    <FormField
                        label="Mensualidad (S/) *"
                        type="number"
                        value={form.pag_monto}
                        onChange={(v) => set('pag_monto', v)}
                        error={err('pag_monto')}
                        placeholder="0.00"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs sm:text-sm">Concepto adicional 1</Label>
                            <Select
                                value={form.pag_nombre1 || '__none__'}
                                onValueChange={(v) => set('pag_nombre1', v === '__none__' ? '' : v)}
                            >
                                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                                    <SelectValue placeholder="—" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">—</SelectItem>
                                    {conceptos.map(c => (
                                        <SelectItem key={`c1-${c.concepto_id}`} value={c.nombre}>{c.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <FormField
                            label="Monto (S/)"
                            type="number"
                            value={form.pag_otro1}
                            onChange={(v) => set('pag_otro1', v)}
                            error={err('pag_otro1')}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs sm:text-sm">Concepto adicional 2</Label>
                            <Select
                                value={form.pag_nombre2 || '__none__'}
                                onValueChange={(v) => set('pag_nombre2', v === '__none__' ? '' : v)}
                            >
                                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                                    <SelectValue placeholder="—" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">—</SelectItem>
                                    {conceptos.map(c => (
                                        <SelectItem key={`c2-${c.concepto_id}`} value={c.nombre}>{c.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <FormField
                            label="Monto (S/)"
                            type="number"
                            value={form.pag_otro2}
                            onChange={(v) => set('pag_otro2', v)}
                            error={err('pag_otro2')}
                            placeholder="0.00"
                        />
                    </div>

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
                            disabled={processing}
                            className="bg-[#00a65a] hover:bg-[#008d4c] text-white w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                        >
                            {processing ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}