import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type { TarifaPago } from '../index';
import type { ConceptoPago } from '../../ConceptoPago/index';

interface Grado { grado_id: number; nombre_grado: string; nivel_id: number; }
interface Nivel { nivel_id: number; nombre_nivel: string; }

interface Props {
    open: boolean;
    onClose: () => void;
    editing: TarifaPago | null;
    conceptos: ConceptoPago[];
    onSaved: () => void;
}

const BLANK = { 
    concepto_id: '', 
    targetType: 'general', // 'general' | 'nivel' | 'grado'
    nivel_id: '', 
    grado_id: '', 
    anio_escolar: new Date().getFullYear(), 
    monto: '', 
    dia_vencimiento: '', 
    activo: true 
};

export default function TarifaPagoFormModal({ open, onClose, editing, conceptos, onSaved }: Props) {
    const [form, setForm]     = useState<any>(BLANK);
    const [grados, setGrados] = useState<Grado[]>([]);
    const [niveles, setNiveles] = useState<Nivel[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');

    useEffect(() => {
        api.get('/grados', { params: { per_page: 100 } }).then(r => setGrados(r.data?.data ?? r.data ?? [])).catch(() => {});
        api.get('/niveles', { params: { per_page: 50 } }).then(r => setNiveles(r.data?.data ?? r.data ?? [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (editing) {
            setForm({
                concepto_id:     String(editing.concepto_id),
                targetType:      editing.grado_id ? 'grado' : editing.nivel_id ? 'nivel' : 'general',
                nivel_id:        editing.nivel_id ? String(editing.nivel_id) : '',
                grado_id:        editing.grado_id ? String(editing.grado_id) : '',
                anio_escolar:    editing.anio_escolar,
                monto:           String(editing.monto),
                dia_vencimiento: (editing as any).dia_vencimiento ? String((editing as any).dia_vencimiento) : '',
                activo:          editing.activo,
            });
        } else {
            setForm(BLANK);
        }
        setError('');
    }, [editing, open]);

    const save = async () => {
        if (!form.concepto_id) { setError('Selecciona un concepto.'); return; }
        if (!form.monto || Number(form.monto) < 0) { setError('El monto debe ser mayor o igual a 0.'); return; }
        setSaving(true);
        try {
            const payload = {
                concepto_id:     Number(form.concepto_id),
                nivel_id:        form.targetType === 'nivel' ? Number(form.nivel_id) : null,
                grado_id:        form.targetType === 'grado' ? Number(form.grado_id) : null,
                anio_escolar:    Number(form.anio_escolar),
                monto:           Number(form.monto),
                dia_vencimiento: form.dia_vencimiento ? Number(form.dia_vencimiento) : null,
                activo:          form.activo,
            };
            if (editing) {
                await api.put(`/tarifas-pago/${editing.tarifa_id}`, payload);
            } else {
                await api.post('/tarifas-pago', payload);
            }
            onSaved();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    const anios = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 1 + i);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Editar tarifa' : 'Nueva tarifa de pago'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Concepto *</label>
                        <select
                            value={form.concepto_id}
                            onChange={e => setForm((f: any) => ({ ...f, concepto_id: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Seleccionar concepto…</option>
                            {conceptos.filter(c => c.activo).map(c => (
                                <option key={c.concepto_id} value={c.concepto_id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">Aplicar a:</label>
                        <div className="flex gap-2">
                            {['general', 'nivel', 'grado'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setForm((f: any) => ({ ...f, targetType: t }))}
                                    className={`flex-1 py-1.5 text-[11px] font-bold uppercase rounded-md border transition-all ${
                                        form.targetType === t 
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {t === 'general' ? 'General' : t === 'nivel' ? 'Por Nivel' : 'Por Grado'}
                                </button>
                            ))}
                        </div>

                        {form.targetType === 'nivel' && (
                            <select
                                value={form.nivel_id}
                                onChange={e => setForm((f: any) => ({ ...f, nivel_id: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Seleccionar nivel…</option>
                                {niveles.map(n => (
                                    <option key={n.nivel_id} value={n.nivel_id}>{n.nombre_nivel}</option>
                                ))}
                            </select>
                        )}

                        {form.targetType === 'grado' && (
                            <select
                                value={form.grado_id}
                                onChange={e => setForm((f: any) => ({ ...f, grado_id: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Seleccionar grado…</option>
                                {grados.map(g => (
                                    <option key={g.grado_id} value={g.grado_id}>{g.nombre_grado}</option>
                                ))}
                            </select>
                        )}

                        {form.targetType === 'general' && (
                            <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                                <p className="text-[10px] text-gray-400 font-medium">Esta tarifa aplicará a todos los estudiantes de la institución.</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Año escolar *</label>
                            <select
                                value={form.anio_escolar}
                                onChange={e => setForm((f: any) => ({ ...f, anio_escolar: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {anios.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto (S/) *</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.monto}
                                onChange={e => setForm((f: any) => ({ ...f, monto: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Día de vencimiento — solo para conceptos mensuales */}
                    {conceptos.find(c => String(c.concepto_id) === form.concepto_id)?.periodicidad === 'mensual' && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Día de vencimiento <span className="text-gray-400 font-normal">(día del mes en que vence el pago)</span>
                            </label>
                            <select
                                value={form.dia_vencimiento}
                                onChange={e => setForm((f: any) => ({ ...f, dia_vencimiento: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Sin día definido</option>
                                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d}>Día {d}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {editing && (
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.activo}
                                onChange={e => setForm((f: any) => ({ ...f, activo: e.target.checked }))}
                                className="rounded"
                            />
                            Tarifa activa
                        </label>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
                        <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={save} disabled={saving}>
                            {saving ? 'Guardando…' : editing ? 'Actualizar' : 'Crear tarifa'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
