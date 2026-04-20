import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type { ConceptoPago } from '../index';

interface Props {
    open: boolean;
    onClose: () => void;
    editing: ConceptoPago | null;
    onSaved: () => void;
}

type FormState = { nombre: string; descripcion: string; periodicidad: 'mensual' | 'anual' | 'unico' };

const BLANK: FormState = { nombre: '', descripcion: '', periodicidad: 'mensual' };

export default function ConceptoPagoFormModal({ open, onClose, editing, onSaved }: Props) {
    const [form, setForm]     = useState<FormState>(BLANK);
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');

    useEffect(() => {
        if (editing) {
            setForm({
                nombre:       editing.nombre,
                descripcion:  editing.descripcion ?? '',
                periodicidad: editing.periodicidad,
            });
        } else {
            setForm(BLANK);
        }
        setError('');
    }, [editing, open]);

    const save = async () => {
        if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
        setSaving(true);
        try {
            if (editing) {
                await api.put(`/conceptos-pago/${editing.concepto_id}`, form);
            } else {
                await api.post('/conceptos-pago', form);
            }
            onSaved();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Editar concepto' : 'Nuevo concepto de pago'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre *</label>
                        <input
                            value={form.nombre}
                            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Pensión Mensual, Matrícula..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Descripción</label>
                        <textarea
                            value={form.descripcion}
                            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                            rows={2}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Descripción opcional..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Periodicidad *</label>
                        <select
                            value={form.periodicidad}
                            onChange={e => setForm(f => ({ ...f, periodicidad: e.target.value as any }))}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="mensual">Mensual</option>
                            <option value="anual">Anual</option>
                            <option value="unico">Único</option>
                        </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={save} disabled={saving}>
                            {saving ? 'Guardando…' : editing ? 'Actualizar' : 'Crear concepto'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
