import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type { DescuentoAlumno } from '../index';
import type { ConceptoPago } from '../../ConceptoPago/index';

interface Estudiante {
    estu_id: number;
    perfil?: { primer_nombre: string; apellido_paterno: string; apellido_materno?: string };
}

interface Nivel {
    nivel_id: number;
    nombre_nivel: string;
}

interface Grado {
    grado_id: number;
    nombre_grado: string;
    nivel_id: number;
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
    nivel_id: '',
    grado_id: '',
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
    const [niveles, setNiveles]     = useState<Nivel[]>([]);
    const [grados, setGrados]       = useState<Grado[]>([]);
    const [targetType, setTargetType] = useState<'alumno' | 'nivel' | 'grado'>('alumno');
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');

    useEffect(() => {
        api.get('/estudiantes', { params: { per_page: 200 } })
            .then(r => setEstudiantes(r.data?.data ?? r.data ?? []))
            .catch(() => {});
        
        api.get('/niveles', { params: { per_page: 50 } })
            .then(r => setNiveles(r.data?.data ?? r.data ?? []))
            .catch(() => {});
        
        api.get('/grados', { params: { per_page: 100 } })
            .then(r => setGrados(r.data?.data ?? r.data ?? []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (editing) {
            const type = editing.estu_id ? 'alumno' : editing.nivel_id ? 'nivel' : 'grado';
            setTargetType(type);
            setForm({
                estu_id:      editing.estu_id ? String(editing.estu_id) : '',
                nivel_id:     editing.nivel_id ? String(editing.nivel_id) : '',
                grado_id:     editing.grado_id ? String(editing.grado_id) : '',
                concepto_id:  editing.concepto_id ? String(editing.concepto_id) : '',
                motivo:       editing.motivo,
                tipo:         editing.tipo,
                valor:        String(editing.valor),
                fecha_inicio: editing.fecha_inicio.split('T')[0],
                fecha_fin:    editing.fecha_fin ? editing.fecha_fin.split('T')[0] : '',
                observacion:  editing.observacion ?? '',
                activo:       editing.activo,
            });
        } else {
            setTargetType('alumno');
            setForm(BLANK);
        }
        setError('');
    }, [editing, open]);

    const save = async () => {
        if (targetType === 'alumno' && !form.estu_id) { setError('Selecciona un alumno.'); return; }
        if (targetType === 'nivel' && !form.nivel_id) { setError('Selecciona un nivel.'); return; }
        if (targetType === 'grado' && !form.grado_id) { setError('Selecciona un grado.'); return; }
        if (!form.valor || Number(form.valor) <= 0) { setError('El valor debe ser mayor a 0.'); return; }
        if (!form.fecha_inicio) { setError('La fecha de inicio es obligatoria.'); return; }
        setSaving(true);
        try {
            const payload = {
                estu_id:      targetType === 'alumno' ? Number(form.estu_id) : null,
                nivel_id:     targetType === 'nivel' ? Number(form.nivel_id) : null,
                grado_id:     targetType === 'grado' ? Number(form.grado_id) : null,
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
        e.perfil ? `${e.perfil.primer_nombre} ${e.perfil.apellido_paterno} ${e.perfil.apellido_materno ?? ''}`.trim() : `Est. #${e.estu_id}`;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Editar descuento' : 'Nuevo descuento / beca'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Aplicar a *</label>
                        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                            {(['alumno', 'nivel', 'grado'] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTargetType(t)}
                                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${targetType === t ? 'bg-white shadow text-rose-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {t === 'alumno' ? 'Alumno' : t === 'nivel' ? 'Nivel' : 'Grado'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {targetType === 'alumno' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
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

                    {targetType === 'nivel' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Nivel *</label>
                            <select
                                value={form.nivel_id}
                                onChange={e => setForm((f: any) => ({ ...f, nivel_id: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            >
                                <option value="">Seleccionar nivel…</option>
                                {niveles.map(n => (
                                    <option key={n.nivel_id} value={n.nivel_id}>{n.nombre_nivel}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {targetType === 'grado' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Grado *</label>
                            <select
                                value={form.grado_id}
                                onChange={e => setForm((f: any) => ({ ...f, grado_id: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            >
                                <option value="">Seleccionar grado…</option>
                                {grados.map(g => (
                                    <option key={g.grado_id} value={g.grado_id}>
                                        {g.nombre_grado} ({niveles.find(n => n.nivel_id === g.nivel_id)?.nombre_nivel})
                                    </option>
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
