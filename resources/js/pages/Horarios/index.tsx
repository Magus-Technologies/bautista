import { Head } from '@inertiajs/react';
import { Clock, GraduationCap, Pencil, Trash2, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import ConfirmModal from '@/components/shared/ConfirmModal';
import FormField from '@/components/shared/FormField';
import PageHeader from '@/components/shared/PageHeader';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useResource } from '@/hooks/useResource';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import axios from 'axios';
import { cn } from '@/lib/utils';

type Horario = {
    horario_id: number;
    insti_id: number;
    nivel_id: number | null;
    tipo_usuario: 'E' | 'D';
    turno: 'M' | 'T' | 'N';
    hora_ingreso: string;
    hora_salida: string;
    nivel?: {
        nivel_id: number;
        nombre_nivel: string;
    };
};

type Nivel = {
    nivel_id: number;
    nombre_nivel: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Horarios de Asistencia', href: '/horarios' },
];

const turnoLabel = (t: string) => t === 'M' ? 'Mañana' : t === 'T' ? 'Tarde' : 'Noche';

export default function HorariosPage() {
    const [activeTab, setActiveTab] = useState<'E' | 'D'>('E');
    const [open, setOpen]               = useState(false);
    const [editing, setEditing]         = useState<Horario | null>(null);
    const [niveles, setNiveles]         = useState<Nivel[]>([]);
    const [confirmDelete, setConfirmDelete] = useState<Horario | null>(null);
    const [form, setForm] = useState({
        nivel_id:     '',
        tipo_usuario: 'E' as 'E' | 'D',
        turno:        'M' as 'M' | 'T' | 'N',
        hora_ingreso: '',
        hora_salida:  '',
    });

    const resEstudiante = useResource<Horario>('/horarios-asistencia', { tipo_usuario: 'E' });
    const resDocente    = useResource<Horario>('/horarios-asistencia', { tipo_usuario: 'D' });
    const res           = activeTab === 'E' ? resEstudiante : resDocente;

    useEffect(() => {
        axios.get('/api/niveles').then(r => {
            const data = r.data.data || r.data;
            setNiveles(Array.isArray(data) ? data : []);
        }).catch(() => setNiveles([]));
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({
            nivel_id:     '',
            tipo_usuario: activeTab,
            turno:        'M',
            hora_ingreso: '',
            hora_salida:  '',
        });
        setOpen(true);
    };

    const openEdit = (h: Horario) => {
        setEditing(h);
        setForm({
            nivel_id:     h.nivel_id?.toString() || '',
            tipo_usuario: h.tipo_usuario,
            turno:        h.turno,
            hora_ingreso: h.hora_ingreso.substring(0, 5),
            hora_salida:  h.hora_salida.substring(0, 5),
        });
        setOpen(true);
    };

    const confirmDeleteAction = async () => {
        if (confirmDelete) {
            await res.remove(confirmDelete.horario_id);
            setConfirmDelete(null);
        }
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        const data = {
            nivel_id:     form.tipo_usuario === 'E' && form.nivel_id ? parseInt(form.nivel_id) : null,
            tipo_usuario: form.tipo_usuario,
            turno:        form.turno,
            hora_ingreso: form.hora_ingreso,
            hora_salida:  form.hora_salida,
        };
        if (editing) {
            await res.update(editing.horario_id, data);
        } else {
            await res.create(data);
        }
        setOpen(false);
    };

    const columnsEstudiante: Column<Horario>[] = [
        { label: '#', render: (_h, i) => ((res.rows?.current_page || 1) - 1) * (res.rows?.per_page || 15) + (i || 0) + 1 },
        { label: 'Nivel', render: (h) => h.nivel?.nombre_nivel || <span className="text-gray-400">Sin nivel</span> },
        { label: 'Turno', render: (h) => turnoLabel(h.turno) },
        { label: 'Ingreso', render: (h) => h.hora_ingreso.substring(0, 5) },
        { label: 'Salida',  render: (h) => h.hora_salida.substring(0, 5) },
        { label: 'Acciones', render: (h) => <Actions h={h} onEdit={openEdit} onDelete={setConfirmDelete} /> },
    ];

    const columnsDocente: Column<Horario>[] = [
        { label: '#', render: (_h, i) => ((res.rows?.current_page || 1) - 1) * (res.rows?.per_page || 15) + (i || 0) + 1 },
        { label: 'Turno', render: (h) => turnoLabel(h.turno) },
        { label: 'Ingreso', render: (h) => h.hora_ingreso.substring(0, 5) },
        { label: 'Salida',  render: (h) => h.hora_salida.substring(0, 5) },
        { label: 'Acciones', render: (h) => <Actions h={h} onEdit={openEdit} onDelete={setConfirmDelete} /> },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Horarios de Asistencia" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <PageHeader
                        icon={Clock}
                        title="Horarios de Asistencia"
                        subtitle="Configuración de horarios de entrada y salida"
                        iconColor="bg-blue-600"
                    />
                    <Button onClick={openCreate} className="bg-[#00a65a] hover:bg-[#008d4c] text-white">
                        + Nuevo Horario
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl gap-1 w-full sm:w-auto self-start">
                    <button
                        onClick={() => setActiveTab('E')}
                        className={cn(
                            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                            activeTab === 'E'
                                ? 'bg-white shadow text-gray-900'
                                : 'text-gray-500 hover:text-gray-700',
                        )}
                    >
                        <GraduationCap className="size-3.5" />
                        Estudiantes
                        {resEstudiante.rows?.total !== undefined && (
                            <span className={cn(
                                'rounded-full px-1.5 py-px text-[10px] font-black',
                                activeTab === 'E' ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500',
                            )}>
                                {resEstudiante.rows.total}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('D')}
                        className={cn(
                            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                            activeTab === 'D'
                                ? 'bg-white shadow text-gray-900'
                                : 'text-gray-500 hover:text-gray-700',
                        )}
                    >
                        <UserCheck className="size-3.5" />
                        Docentes
                        {resDocente.rows?.total !== undefined && (
                            <span className={cn(
                                'rounded-full px-1.5 py-px text-[10px] font-black',
                                activeTab === 'D' ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500',
                            )}>
                                {resDocente.rows.total}
                            </span>
                        )}
                    </button>
                </div>

                {/* Tabla */}
                {res.rows && (
                    <ResourceTable
                        rows={res.rows}
                        columns={activeTab === 'E' ? columnsEstudiante : columnsDocente}
                        getKey={(h) => h.horario_id}
                        onPageChange={res.setPage}
                    />
                )}
                {res.loading && (
                    <div className="py-8 text-center text-sm text-gray-400 animate-pulse">Cargando...</div>
                )}
            </div>

            {/* Modal crear/editar */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar Horario' : 'Nuevo Horario'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipo de Usuario</Label>
                            <Select
                                value={form.tipo_usuario}
                                onValueChange={(v: 'E' | 'D') => setForm({ ...form, tipo_usuario: v, nivel_id: '' })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="E">Estudiante</SelectItem>
                                    <SelectItem value="D">Docente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {form.tipo_usuario === 'E' && (
                            <div className="space-y-2">
                                <Label>Nivel Educativo <span className="text-red-500">*</span></Label>
                                <Select
                                    value={form.nivel_id}
                                    onValueChange={(v) => setForm({ ...form, nivel_id: v })}
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
                        )}

                        <div className="space-y-2">
                            <Label>Turno</Label>
                            <Select
                                value={form.turno}
                                onValueChange={(v: 'M' | 'T' | 'N') => setForm({ ...form, turno: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="M">Mañana</SelectItem>
                                    <SelectItem value="T">Tarde</SelectItem>
                                    <SelectItem value="N">Noche</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Hora de Ingreso"
                                type="time"
                                value={form.hora_ingreso}
                                onChange={(v) => setForm({ ...form, hora_ingreso: v })}
                                required
                            />
                            <FormField
                                label="Hora de Salida"
                                type="time"
                                value={form.hora_salida}
                                onChange={(v) => setForm({ ...form, hora_salida: v })}
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-[#00a65a] hover:bg-[#008d4c] text-white">Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={confirmDeleteAction}
                title="Eliminar Horario"
                message={confirmDelete
                    ? `¿Eliminar horario ${turnoLabel(confirmDelete.turno)} (${confirmDelete.tipo_usuario === 'E' ? 'Estudiante' : 'Docente'})?`
                    : ''}
                confirmText="Eliminar"
                variant="danger"
            />
        </AppLayout>
    );
}
function Actions({ h, onEdit, onDelete }: {
    h: Horario;
    onEdit: (h: Horario) => void;
    onDelete: (h: Horario) => void;
}) {
    return (
        <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(h)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(h)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
