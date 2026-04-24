import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormField from '@/components/shared/FormField';
import ConfirmModal from '@/components/shared/ConfirmModal';
import axios from 'axios';

type Props = {
    open: boolean;
    onClose: () => void;
    editing: any | null;
    onSuccess: () => void;
};

export default function ContratoFormModal({ open, onClose, editing, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [usuariosFiltrados, setUsuariosFiltrados] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [rolSeleccionado, setRolSeleccionado] = useState<string>('todos');
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [form, setForm] = useState({
        user_id: '',
        tipo_contrato: 'tiempo_completo',
        sueldo_base: '',
        bonificaciones: '0',
        horas_semanales: '40',
        descuento_por_tardanza: '0',
        tipo_descuento: 'fijo',
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'activo',
        observaciones: '',
    });

    useEffect(() => {
        if (open) {
            loadRoles();
            loadUsuarios();
            if (editing) {
                setForm({
                    user_id: editing.user_id?.toString() || '',
                    tipo_contrato: editing.tipo_contrato || 'tiempo_completo',
                    sueldo_base: editing.sueldo_base?.toString() || '',
                    bonificaciones: editing.bonificaciones?.toString() || '0',
                    horas_semanales: editing.horas_semanales?.toString() || '40',
                    descuento_por_tardanza: editing.descuento_por_tardanza?.toString() || '0',
                    tipo_descuento: editing.tipo_descuento || 'fijo',
                    fecha_inicio: editing.fecha_inicio || '',
                    fecha_fin: editing.fecha_fin || '',
                    estado: editing.estado || 'activo',
                    observaciones: editing.observaciones || '',
                });
            } else {
                setForm({
                    user_id: '',
                    tipo_contrato: 'tiempo_completo',
                    sueldo_base: '',
                    bonificaciones: '0',
                    horas_semanales: '40',
                    descuento_por_tardanza: '0',
                    tipo_descuento: 'fijo',
                    fecha_inicio: '',
                    fecha_fin: '',
                    estado: 'activo',
                    observaciones: '',
                });
            }
        }
    }, [open, editing]);

    const loadRoles = async () => {
        try {
            const response = await axios.get('/api/seguridad/roles/trabajadores');
            setRoles(response.data || []);
        } catch (error) {
            console.error('Error al cargar roles:', error);
        }
    };

    const loadUsuarios = async () => {
        try {
            const response = await axios.get('/api/usuarios', { params: { es_trabajador: 1 } });
            const usuariosData = response.data.data || [];
            setUsuarios(usuariosData);
            setUsuariosFiltrados(usuariosData);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        }
    };

    useEffect(() => {
        let filtrados: any[];
        if (rolSeleccionado === 'todos') {
            filtrados = usuarios;
        } else {
            filtrados = usuarios.filter((u) => u.rol_name === rolSeleccionado);
        }
        setUsuariosFiltrados(filtrados);
        
        // Limpiar selección de usuario si no está en la lista filtrada
        if (form.user_id && !filtrados.find((u) => u.id.toString() === form.user_id)) {
            setForm((prev) => ({ ...prev, user_id: '' }));
        }
    }, [rolSeleccionado, usuarios]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                ...form,
                user_id: parseInt(form.user_id),
                sueldo_base: parseFloat(form.sueldo_base),
                bonificaciones: parseFloat(form.bonificaciones),
                horas_semanales: parseInt(form.horas_semanales),
                descuento_por_tardanza: parseFloat(form.descuento_por_tardanza),
                fecha_fin: form.fecha_fin || null,
            };

            if (editing) {
                await axios.put(`/api/rh/contratos/${editing.contrato_id}`, data);
                setConfirmMessage('Contrato actualizado exitosamente');
            } else {
                await axios.post('/api/rh/contratos', data);
                setConfirmMessage('Contrato creado exitosamente');
            }

            setShowConfirm(true);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar el contrato');
            setLoading(false);
        }
    };

    const handleConfirmClose = () => {
        setShowConfirm(false);
        setLoading(false);
        onSuccess();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar Contrato' : 'Nuevo Contrato'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Filtrar por Rol</Label>
                            <Select value={rolSeleccionado} onValueChange={setRolSeleccionado} disabled={!!editing}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos los roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los roles</SelectItem>
                                    {roles.map((r) => (
                                        <SelectItem key={r.id} value={r.name}>
                                            {r.display_name || r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Trabajador <span className="text-red-500">*</span></Label>
                            <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })} disabled={!!editing}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un trabajador" />
                                </SelectTrigger>
                                <SelectContent>
                                    {usuariosFiltrados.map((u) => (
                                        <SelectItem key={u.id} value={u.id.toString()}>
                                            {u.nombre_completo || u.name} {u.rol_name && `(${u.rol_name})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {rolSeleccionado && (
                                <p className="text-sm text-muted-foreground">
                                    Mostrando solo usuarios con rol: {roles.find(r => r.name === rolSeleccionado)?.display_name || rolSeleccionado}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo de Contrato</Label>
                                <Select value={form.tipo_contrato} onValueChange={(v) => setForm({ ...form, tipo_contrato: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tiempo_completo">Tiempo Completo</SelectItem>
                                        <SelectItem value="medio_tiempo">Medio Tiempo</SelectItem>
                                        <SelectItem value="por_horas">Por Horas</SelectItem>
                                        <SelectItem value="practicante">Practicante</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="activo">Activo</SelectItem>
                                        <SelectItem value="suspendido">Suspendido</SelectItem>
                                        <SelectItem value="finalizado">Finalizado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Sueldo Base"
                                type="number"
                                step="0.01"
                                value={form.sueldo_base}
                                onChange={(v) => setForm({ ...form, sueldo_base: v })}
                                required
                            />
                            <FormField
                                label="Bonificaciones"
                                type="number"
                                step="0.01"
                                value={form.bonificaciones}
                                onChange={(v) => setForm({ ...form, bonificaciones: v })}
                            />
                        </div>

                        <FormField
                            label="Horas Semanales"
                            type="number"
                            value={form.horas_semanales}
                            onChange={(v) => setForm({ ...form, horas_semanales: v })}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Descuento por Tardanza"
                                type="number"
                                step="0.01"
                                value={form.descuento_por_tardanza}
                                onChange={(v) => setForm({ ...form, descuento_por_tardanza: v })}
                            />
                            <div className="space-y-2">
                                <Label>Tipo de Descuento</Label>
                                <Select value={form.tipo_descuento} onValueChange={(v) => setForm({ ...form, tipo_descuento: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fijo">Monto Fijo</SelectItem>
                                        <SelectItem value="porcentaje">Porcentaje</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Fecha Inicio"
                                type="date"
                                value={form.fecha_inicio}
                                onChange={(v) => setForm({ ...form, fecha_inicio: v })}
                                required
                            />
                            <FormField
                                label="Fecha Fin (opcional)"
                                type="date"
                                value={form.fecha_fin}
                                onChange={(v) => setForm({ ...form, fecha_fin: v })}
                            />
                        </div>

                        <FormField
                            label="Observaciones"
                            type="textarea"
                            value={form.observaciones}
                            onChange={(v) => setForm({ ...form, observaciones: v })}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-[#00a65a] hover:bg-[#008d4c] text-white" disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                open={showConfirm}
                onClose={handleConfirmClose}
                onConfirm={handleConfirmClose}
                title="Operación exitosa"
                message={confirmMessage}
                confirmText="Aceptar"
                variant="default"
            />
        </>
    );
}
