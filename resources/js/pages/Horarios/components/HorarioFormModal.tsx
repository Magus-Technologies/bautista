import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormField from '@/components/shared/FormField';
import type { Horario, Nivel, HorarioFormData, RolTrabajador } from '../hooks/useHorarios';

type Props = {
    open: boolean;
    editing: Horario | null;
    form: HorarioFormData;
    niveles: Nivel[];
    rolesTrabajadores: RolTrabajador[];
    onClose: () => void;
    onSubmit: (e: React.SyntheticEvent) => void;
    onFormChange: (form: HorarioFormData) => void;
};

export default function HorarioFormModal({ open, editing, form, niveles, rolesTrabajadores, onClose, onSubmit, onFormChange }: Props) {
    // Determinar si es estudiante o trabajador basado en si hay rol_id o nivel_id
    const isEstudiante = form.tipo_usuario === 'E';
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Editar Horario' : 'Nuevo Horario de Asistencia'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isEstudiante ? (
                            <div className="space-y-2">
                                <Label>Nivel Educativo <span className="text-red-500">*</span></Label>
                                <Select
                                    value={form.nivel_id}
                                    onValueChange={(v) => onFormChange({ ...form, nivel_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un nivel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {niveles.map(n => (
                                            <SelectItem key={n.nivel_id} value={n.nivel_id.toString()}>
                                                {n.nombre_nivel}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Rol <span className="text-red-500">*</span></Label>
                                <Select
                                    value={form.rol_id}
                                    onValueChange={(v) => onFormChange({ ...form, rol_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rolesTrabajadores.map(rol => (
                                            <SelectItem key={rol.id} value={rol.id.toString()}>
                                                {rol.name.replace('_', ' ').toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">
                                    Solo se muestran los roles marcados como trabajadores
                                </p>
                            </div>
                        )}

                        {!isEstudiante && (
                            <div className="space-y-2">
                                <Label>Nivel Educativo <span className="text-gray-400 font-normal">(opcional)</span></Label>
                                <Select
                                    value={form.nivel_id || 'ninguno'}
                                    onValueChange={(v) => onFormChange({ ...form, nivel_id: v === 'ninguno' ? '' : v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos los niveles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ninguno">Todos los niveles</SelectItem>
                                        {niveles.map(n => (
                                            <SelectItem key={n.nivel_id} value={n.nivel_id.toString()}>
                                                {n.nombre_nivel}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">
                                    Permite distinguir horarios cuando el mismo rol tiene horarios distintos por nivel
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Turno</Label>
                            <Select
                                value={form.turno}
                                onValueChange={(v: 'M' | 'T' | 'N') => onFormChange({ ...form, turno: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="M">Mañana</SelectItem>
                                    <SelectItem value="T">Tarde</SelectItem>
                                    <SelectItem value="N">Noche</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label="Hora de Ingreso"
                            type="time"
                            value={form.hora_ingreso}
                            onChange={(v) => onFormChange({ ...form, hora_ingreso: v })}
                            required
                        />
                        <FormField
                            label="Hora de Salida"
                            type="time"
                            value={form.hora_salida}
                            onChange={(v) => onFormChange({ ...form, hora_salida: v })}
                            required
                        />
                    </div>

                    <FormField
                        label="Tolerancia (minutos)"
                        type="number"
                        value={form.minutos_tolerancia}
                        onChange={(v) => onFormChange({ ...form, minutos_tolerancia: v })}
                        min={0}
                        max={60}
                        required
                        helpText="Minutos de tolerancia antes de marcar tardanza"
                    />

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="bg-[#00a65a] hover:bg-[#008d4c] text-white">Guardar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
