import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type { DescuentoAlumno } from '../index';
import type { ConceptoPago } from '../../ConceptoPago/index';

interface Estudiante {
    estu_id: number;
    perfil?: { primer_nombre: string; primer_apellido: string };
}

interface Props {
    open: boolean;
    onClose: () => void;
    editing: DescuentoAlumno | null;
    conceptos: ConceptoPago[];
    onSaved: () => void;
}

const BLANK = {
    estu_id: '',
    concepto_id: '',
    motivo: 'beca',
    tipo: 'porcentaje',
    valor: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    observacion: '',
    activo: true,
};

export default function DescuentoFormModal({ open, onClose, editing, conceptos, onSaved }: Props) {
    const [form, setForm]           = useState<any>(BLANK);
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');

    useEffect(() => {
        api.get('/estudiantes', { params: { per_page: 200 } })
            .then(r => setEstudiantes(r.data?.data ?? r.data ?? []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (editing) {
            setForm({
                estu_id:      String(editing.estu_id),
                concepto_id:  editing.concepto_id ? String(editing.concepto_id) : '',
                motivo:       editing.motivo,
                tipo:         editing.tipo,
                valor:        String(editing.valor),
                fecha_inicio: editing.fecha_inicio,
                fecha_fin:    editing.fecha_fin ?? '',
                observacion:  editing.observacion ?? '',
                activo:       editing.activo,
            });
        } else {
            setForm(BLANK);
        }
        setError('');
    }, [editing, open]);

    const save = async () => {
        if (!form.estu_id) { setError('Selecciona un alumno.'); return; }
        if (!form.valor || Number(form.valor) <= 0) { setError('El valor debe ser mayor a 0.'); return; }
        if (!form.fecha_inicio) { setError('La fecha de inicio es obligatoria.'); return; }
        setSaving(true);
        try {
            const payload = {
                estu_id:      Number(form.estu_id),
                concepto_id:  form.concepto_id ? Number(form.concepto_id) : null,
                motivo:       form.motivo,
                tipo:         form.tipo,
                valor:        Number(form.valor),
                fecha_inicio: form.fecha_inicio,
                fecha_fin:    form.fecha_fin || null,
                observacion:  form.observacion || null,
                activo:       form.activo,
            };
            if (editing) {
                await api.put(`/descuentos/${editing.descuento_id}`, payload);
            } else {
                await api.post('/descuentos', payload);
            }
            onSaved();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    const nombreEstu = (e: Estudiante) =>
        e.perfil ? `${e.perfil.primer_nombre} ${e.perfil.primer_apellido}` : `Est. #${e.estu_id}`;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Editar descuento' : 'Nuevo descuento / beca'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                    {!editing && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Alumno *</label>
                            <select
                                value={form.estu_id}
                                onChange={e => setForm((f: any) => ({ ...f, estu_id: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            >
                                <option value="">Seleccionar alumno…</option>
                                {estudiantes.map(e => (
                                    <option key={e.estu_id} value={e.estu_id}>{nombreEstu(e)}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Concepto <span className="text-gray-400 font-normal">(vacío = descuento general)</span></label>
                        <select
                            value={form.concepto_id}
                            onChange={e => setForm((f: any) => ({ ...f, concepto_id: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                            <option value="">General (todos los conceptos)</option>
                            {conceptos.filter(c => c.activo).map(c => (
                                <option key={c.concepto_id} value={c.concepto_id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Motivo *</label>
                            <select
                                value={form.motivo}
                                onChange={e => setForm((f: any) => ({ ...f, motivo: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            >
                                <option value="hermanos">Hermanos</option>
                                <option value="merito">Mérito académico</option>
                                <option value="beca">Beca</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo *</label>
                            <select
                                value={form.tipo}
                                onChange={e => setForm((f: any) => ({ ...f, tipo: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            >
                                <option value="porcentaje">Porcentaje (%)</option>
                                <option value="monto_fijo">Monto fijo (S/)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Valor * {form.tipo === 'porcentaje' ? '(%)' : '(S/)'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={form.tipo === 'porcentaje' ? 100 : undefined}
                            step="0.01"
                            value={form.valor}
                            onChange={e => setForm((f: any) => ({ ...f, valor: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder={form.tipo === 'porcentaje' ? 'Ej: 25' : 'Ej: 50.00'}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha inicio *</label>
                            <input
                                type="date"
                                value={form.fecha_inicio}
                                onChange={e => setForm((f: any) => ({ ...f, fecha_inicio: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha fin <span className="text-gray-400 font-normal">(indefinido si vacío)</span></label>
                            <input
                                type="date"
                                value={form.fecha_fin}
                                onChange={e => setForm((f: any) => ({ ...f, fecha_fin: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Observación</label>
                        <textarea
                            value={form.observacion}
                            onChange={e => setForm((f: any) => ({ ...f, observacion: e.target.value }))}
                            rows={2}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                            placeholder="Notas internas opcionales..."
                        />
                    </div>

                    {editing && (
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.activo}
                                onChange={e => setForm((f: any) => ({ ...f, activo: e.target.checked }))}
                                className="rounded"
                            />
                            Descuento activo
                        </label>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
                        <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" onClick={save} disabled={saving}>
                            {saving ? 'Guardando…' : editing ? 'Actualizar' : 'Crear descuento'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
