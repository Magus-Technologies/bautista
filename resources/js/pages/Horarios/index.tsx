import { Head } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '@/components/shared/ConfirmModal';
import PageHeader from '@/components/shared/PageHeader';
import ResourceTable from '@/components/shared/ResourceTable';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useHorarios } from './hooks/useHorarios';
import { useHorarioForm } from './hooks/useHorarioForm';
import HorarioFormModal from './components/HorarioFormModal';
import HorarioTabs from './components/HorarioTabs';
import { getEstudianteColumns, getTrabajadorColumns } from './utils/horarioColumns';
import type { Horario } from './hooks/useHorarios';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Horarios de Asistencia', href: '/horarios' },
];

const turnoLabel = (t: string) => t === 'M' ? 'Mañana' : t === 'T' ? 'Tarde' : 'Noche';

export default function HorariosPage() {
    const [activeTab, setActiveTab] = useState<'E' | 'T'>('E');
    const [confirmDelete, setConfirmDelete] = useState<Horario | null>(null);

    const { res, resEstudiante, resTrabajador, niveles, rolesTrabajadores } = useHorarios(activeTab);
    const { open, editing, form, setForm, openCreate, openEdit, closeModal } = useHorarioForm(activeTab);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        const data = {
            nivel_id: form.tipo_usuario === 'E' && form.nivel_id ? parseInt(form.nivel_id) : null,
            tipo_usuario: form.tipo_usuario,
            rol_id: form.tipo_usuario === 'T' && form.rol_id ? parseInt(form.rol_id) : null,
            turno: form.turno,
            hora_ingreso: form.hora_ingreso,
            hora_salida: form.hora_salida,
            minutos_tolerancia: parseInt(form.minutos_tolerancia),
        };
        
        if (editing) {
            await res.update(editing.horario_id, data);
        } else {
            await res.create(data);
        }
        closeModal();
    };

    const confirmDeleteAction = async () => {
        if (confirmDelete) {
            await res.remove(confirmDelete.horario_id);
            setConfirmDelete(null);
        }
    };

    const columns = activeTab === 'E' 
        ? getEstudianteColumns(
            res.rows?.current_page || 1,
            res.rows?.per_page || 15,
            openEdit,
            setConfirmDelete
        )
        : getTrabajadorColumns(
            res.rows?.current_page || 1,
            res.rows?.per_page || 15,
            openEdit,
            setConfirmDelete
        );

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

                <HorarioTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    estudiantesTotal={resEstudiante.rows?.total}
                    trabajadoresTotal={resTrabajador.rows?.total}
                />

                {res.rows && (
                    <ResourceTable
                        rows={res.rows}
                        columns={columns}
                        getKey={(h) => h.horario_id}
                        onPageChange={res.setPage}
                    />
                )}
                
                {res.loading && (
                    <div className="py-8 text-center text-sm text-gray-400 animate-pulse">Cargando...</div>
                )}
            </div>

            <HorarioFormModal
                open={open}
                editing={editing}
                form={form}
                niveles={niveles}
                rolesTrabajadores={rolesTrabajadores}
                onClose={closeModal}
                onSubmit={handleSubmit}
                onFormChange={setForm}
            />

            <ConfirmModal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={confirmDeleteAction}
                title="Eliminar Horario"
                message={confirmDelete
                    ? `¿Eliminar horario ${turnoLabel(confirmDelete.turno)} (${confirmDelete.tipo_usuario === 'E' ? 'Estudiante' : 'Trabajador'})?`
                    : ''}
                confirmText="Eliminar"
                variant="danger"
            />
        </AppLayout>
    );
}
