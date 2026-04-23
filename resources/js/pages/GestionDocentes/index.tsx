import { Head } from '@inertiajs/react';
import { BookOpen, Clock, UserCheck, Download, IdCard } from 'lucide-react';
import { useState } from 'react';
import ResourcePage from '@/components/shared/ResourcePage';
import ResourceTable from '@/components/shared/ResourceTable';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/hooks/usePermission';
import { useResource } from '@/hooks/useResource';
import type { BreadcrumbItem } from '@/types';
import AsignarCursosModal from './components/AsignarCursosModal';
import DocenteFormModal from './components/DocenteFormModal';
import HorarioModal from './components/HorarioModal';
import FotocheckDocenteModal from './components/FotocheckDocenteModal';
import type { Docente } from './hooks/useDocentes';
import { nombreCompleto } from './hooks/useDocentes';
import { docentesColumns } from './hooks/useDocentesColumns';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard',  href: '/dashboard' },
    { title: 'Profesores', href: '/docentes' },
];

export default function DocentesPage() {
    const res = useResource<Docente>('/docentes');
    const { can } = usePermission();
    const [modalOpen, setModalOpen]           = useState(false);
    const [editing, setEditing]               = useState<Docente | null>(null);
    const [asignarDocente, setAsignarDocente] = useState<Docente | null>(null);
    const [horarioDocente, setHorarioDocente] = useState<Docente | null>(null);
    const [fotocheckDocente, setFotocheckDocente] = useState<Docente | null>(null);

    const openCreate   = () => {
 setEditing(null); setModalOpen(true); 
};
    const openEdit     = (d: Docente) => {
 setEditing(d); setModalOpen(true); 
};
    const handleDelete = (d: Docente) => {
        if (confirm(`¿Eliminar al docente "${nombreCompleto(d)}"?`)) {
            res.remove(d.docente_id);
        }
    };

    const handleDescargarFotocheckMasivo = () => {
        window.open('/docentes/fotochecks/masivo', '_blank');
    };

    const handleVerFotocheck = (d: Docente) => {
        setFotocheckDocente(d);
    };

    return (
        <>
            <Head title="Profesores" />
            <ResourcePage
                breadcrumbs={breadcrumbs}
                pageTitle="Profesores"
                subtitle={res.rows ? `${res.rows.total} registrados` : '…'}
                icon={UserCheck}
                iconColor="bg-teal-600"
                search={res.search}
                onSearch={res.setSearch}
                flashSuccess={res.success}
                btnLabel={can('personal.docentes.crear') ? "Nuevo Docente" : undefined}
                onNew={can('personal.docentes.crear') ? openCreate : undefined}
                extraButtons={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDescargarFotocheckMasivo}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Descargar Fotochecks
                    </Button>
                }
            >
                {res.rows && (
                    <ResourceTable
                        rows={res.rows}
                        columns={docentesColumns}
                        getKey={(d) => d.docente_id}
                        onEdit={can('personal.docentes.editar') ? openEdit : undefined}
                        onDelete={can('personal.docentes.eliminar') ? handleDelete : undefined}
                        onPageChange={res.setPage}
                        extraActions={(d) => (
                            <>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Ver Fotocheck"
                                    className="size-7 text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleVerFotocheck(d)}
                                >
                                    <IdCard className="size-3.5" />
                                </Button>
                                {can('personal.docentes.cursos') && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title="Asignar Cursos"
                                        className="size-7 text-emerald-600 hover:bg-emerald-50"
                                        onClick={() => setAsignarDocente(d)}
                                    >
                                        <BookOpen className="size-3.5" />
                                    </Button>
                                )}
                                {can('academico.horarios.ver') && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title="Horario"
                                        className="size-7 text-orange-500 hover:bg-orange-50"
                                        onClick={() => setHorarioDocente(d)}
                                    >
                                        <Clock className="size-3.5" />
                                    </Button>
                                )}
                            </>
                        )}
                    />
                )}
                {res.loading && <p className="py-6 text-center text-sm text-gray-400">Cargando...</p>}
            </ResourcePage>

            <DocenteFormModal
                open={modalOpen}
                onClose={() => {
 setModalOpen(false); res.clearSuccess(); 
}}
                editing={editing}
                onSave={editing
                    ? (data) => res.update(editing.docente_id, data)
                    : (data) => res.create(data)}
                apiErrors={res.apiErrors}
                clearErrors={res.clearErrors}
            />

            <AsignarCursosModal
                open={asignarDocente !== null}
                onClose={() => setAsignarDocente(null)}
                docente={asignarDocente}
            />

            <HorarioModal
                open={horarioDocente !== null}
                onClose={() => setHorarioDocente(null)}
                docente={horarioDocente}
            />

            <FotocheckDocenteModal
                open={fotocheckDocente !== null}
                onClose={() => setFotocheckDocente(null)}
                docente={fotocheckDocente}
            />
        </>
    );
}
