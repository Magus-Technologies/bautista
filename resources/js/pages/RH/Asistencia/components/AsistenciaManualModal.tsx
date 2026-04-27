// Componente para el registro manual de asistencia por parte de administración
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormLegend, ReqLabel, OptLabel } from '@/components/shared/FormLabels';
import axios from 'axios';
import { useState, useEffect, FormEvent, useMemo } from 'react';
import { Clock, Search, Filter } from 'lucide-react';

interface AsistenciaManualModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AsistenciaManualModal({ open, onClose, onSuccess }: AsistenciaManualModalProps) {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [horarios, setHorarios] = useState<any[]>([]);
    const [loadingUsuarios, setLoadingUsuarios] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');

    const [formData, setFormData] = useState({
        user_id: '',
        horario_id: '',
        fecha: new Date().toISOString().split('T')[0],
        hora_entrada: '',
        hora_salida: '',
        estado: 'presente',
        observaciones: '',
    });

    useEffect(() => {
        if (open) {
            loadUsuarios();
            loadHorarios();
            setUserSearch('');
            setSelectedRole('all');
            setFormData({
                user_id: '',
                horario_id: '',
                fecha: new Date().toISOString().split('T')[0],
                hora_entrada: '',
                hora_salida: '',
                estado: 'presente',
                observaciones: '',
            });
        }
    }, [open]);

    const loadHorarios = async () => {
        try {
            const response = await axios.get('/api/horarios-asistencia', { params: { tipo_usuario: 'T' } });
            setHorarios(response.data.data || response.data || []);
        } catch {
            setHorarios([]);
        }
    };

    const loadUsuarios = async () => {
        setLoadingUsuarios(true);
        try {
            const response = await axios.get('/api/rh/contratos/activos');
            // Mapear los usuarios de los contratos activos e incluir el rol
            const personal = response.data.data.map((c: any) => ({
                ...c.user,
                rol_name: c.user.rol || 'Sin rol'
            }));
            setUsuarios(personal);
        } catch (error) {
            console.error('Error al cargar personal:', error);
        } finally {
            setLoadingUsuarios(false);
        }
    };

    // Obtener roles únicos de la lista de personal activo cargado
    const availableRoles = useMemo(() => {
        const rolesMap = new Map<string, string>();
        usuarios.forEach(u => {
            if (u.rol_name) {
                const key = u.rol_name.toLowerCase();
                if (!rolesMap.has(key)) {
                    rolesMap.set(key, u.rol_name);
                }
            }
        });
        return Array.from(rolesMap.entries()).map(([id, nombre]) => ({ id, nombre }));
    }, [usuarios]);

    const filteredUsuarios = useMemo(() => {
        let result = usuarios;

        if (selectedRole !== 'all') {
            result = result.filter(u => u.rol_name?.toLowerCase() === selectedRole.toLowerCase());
        }

        if (userSearch) {
            const s = userSearch.toLowerCase();
            result = result.filter(u => 
                (u.nombre_completo || u.name || '').toLowerCase().includes(s) ||
                (u.email || '').toLowerCase().includes(s)
            );
        }

        return result;
    }, [usuarios, userSearch, selectedRole]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const toTimeWithSeconds = (t: string) => t && !t.includes(':00', 4) ? `${t}:00` : t;
            const payload = {
                ...formData,
                horario_id: formData.horario_id ? parseInt(formData.horario_id) : null,
                hora_entrada: formData.hora_entrada ? toTimeWithSeconds(formData.hora_entrada) : null,
                hora_salida: formData.hora_salida ? toTimeWithSeconds(formData.hora_salida) : null,
            };
            await axios.post('/api/rh/asistencia/manual', payload);
            onSuccess();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al registrar asistencia');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="size-5 text-indigo-600" />
                        Registro Manual de Asistencia
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormLegend />

                    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <ReqLabel>Personal</ReqLabel>
                        
                        <div className="grid grid-cols-1 gap-2">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger className="pl-9 bg-white">
                                        <SelectValue placeholder="Todos los roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los roles ({usuarios.length})</SelectItem>
                                        {availableRoles.map(r => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.nombre.replace('_', ' ').toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <Input 
                                    placeholder="Buscar por nombre..." 
                                    className="pl-9 bg-white"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <Select
                            value={formData.user_id?.toString()}
                            onValueChange={(value) => handleChange('user_id', parseInt(value))}
                            disabled={loadingUsuarios}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder={loadingUsuarios ? "Cargando..." : "Seleccionar personal..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredUsuarios.length > 0 ? (
                                    filteredUsuarios.map((user) => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
                                            {user.nombre_completo}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-slate-500">
                                        No se encontraron resultados para los filtros seleccionados
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-slate-400">
                             Mostrando {filteredUsuarios.length} de {usuarios.length} trabajadores activos.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <ReqLabel>Fecha</ReqLabel>
                        <Input
                            type="date"
                            value={formData.fecha}
                            onChange={(e) => handleChange('fecha', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <OptLabel>Turno / Horario</OptLabel>
                        <Select
                            value={formData.horario_id}
                            onValueChange={(v) => handleChange('horario_id', v === 'none' ? '' : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sin horario asignado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin horario asignado</SelectItem>
                                {horarios.map((h: any) => {
                                    const turno = h.turno === 'M' ? 'Mañana' : h.turno === 'T' ? 'Tarde' : 'Noche';
                                    return (
                                        <SelectItem key={h.horario_id} value={h.horario_id.toString()}>
                                            {turno} — {h.hora_ingreso?.substring(0, 5)} a {h.hora_salida?.substring(0, 5)}
                                            {h.rol?.name ? ` (${h.rol.name})` : ''}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-slate-400">
                            Seleccionar el turno permite calcular tardanzas y salidas anticipadas correctamente.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <OptLabel>Hora Entrada</OptLabel>
                            <Input
                                type="time"
                                value={formData.hora_entrada}
                                onChange={(e) => handleChange('hora_entrada', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <OptLabel>Hora Salida</OptLabel>
                            <Input
                                type="time"
                                value={formData.hora_salida}
                                onChange={(e) => handleChange('hora_salida', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <ReqLabel>Estado</ReqLabel>
                        <Select
                            value={formData.estado}
                            onValueChange={(value) => handleChange('estado', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="presente">Presente</SelectItem>
                                <SelectItem value="tardanza">Tardanza</SelectItem>
                                <SelectItem value="ausente">Ausente</SelectItem>
                                <SelectItem value="permiso">Permiso</SelectItem>
                                <SelectItem value="vacaciones">Vacaciones</SelectItem>
                                <SelectItem value="licencia">Licencia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <OptLabel>Observaciones</OptLabel>
                        <Textarea
                            value={formData.observaciones}
                            onChange={(e) => handleChange('observaciones', e.target.value)}
                            placeholder="Motivo del registro manual..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !formData.user_id} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isSubmitting ? 'Guardando...' : 'Registrar Asistencia'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
