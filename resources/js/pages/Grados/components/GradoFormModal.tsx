import TitleForm from '@/components/TitleForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGradoForm } from '../hooks/useGradoForm';
import type { Grado, GradoFormData, Nivel } from '../hooks/useGrados';

type Props = {
    open: boolean;
    onClose: () => void;
    editing: Grado | null;
    niveles: Nivel[];
    defaultNivelId?: string;
    onSave: (data: GradoFormData) => Promise<void>;
    apiErrors: Record<string, string[]>;
    clearErrors: () => void;
};

export default function GradoFormModal({ open, onClose, editing, niveles, defaultNivelId, onSave, apiErrors, clearErrors }: Props) {
    const { form, set, processing, handleSubmit } = useGradoForm({ editing, open, onSave, onClose, clearErrors, defaultNivelId });

    const err = (key: keyof GradoFormData) => apiErrors[key]?.[0];

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Editar Grado' : 'Nuevo Grado'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <TitleForm>Datos del Grado</TitleForm>

                    {/* Nivel Contextual o Selector */}
                    {defaultNivelId && !editing ? (
                        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Nivel Educativo</p>
                                <p className="text-sm font-bold text-indigo-700">
                                    {niveles.find(n => String(n.nivel_id) === defaultNivelId)?.nombre_nivel ?? 'Cargando...'}
                                </p>
                            </div>
                            <div className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-md">
                                PRE-SELECCIONADO
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <label className="text-sm font-medium flex items-center gap-1 text-gray-600">
                                <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />
                                Nivel Educativo
                            </label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={form.nivel_id}
                                onChange={(e) => set('nivel_id', e.target.value)}
                                required
                            >
                                <option value="">Seleccionar nivel...</option>
                                {niveles.map((n) => (
                                    <option key={n.nivel_id} value={n.nivel_id}>{n.nombre_nivel}</option>
                                ))}
                            </select>
                            {err('nivel_id') && <p className="text-xs text-red-500">{err('nivel_id')}</p>}
                        </div>
                    )}

                    {/* Nombre */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-rose-700 inline-block" />
                            Nombre del Grado
                        </label>
                        <input
                            type="text"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={form.nombre_grado}
                            onChange={(e) => set('nombre_grado', e.target.value)}
                            placeholder="Ej: Primer Grado"
                            required
                        />
                        {err('nombre_grado') && <p className="text-xs text-red-500">{err('nombre_grado')}</p>}
                    </div>

                    {/* Abreviatura */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-cyan-600 inline-block" />
                            Abreviatura
                        </label>
                        <input
                            type="text"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={form.abreviatura}
                            onChange={(e) => set('abreviatura', e.target.value)}
                            placeholder="Ej: 1°"
                        />
                        {err('abreviatura') && <p className="text-xs text-red-500">{err('abreviatura')}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100">
                            {processing ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
