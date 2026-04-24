import { Head } from '@inertiajs/react';
import { Briefcase, Pencil, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '@/components/shared/ConfirmModal';
import PageHeader from '@/components/shared/PageHeader';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import { Button } from '@/components/ui/button';
import { useResource } from '@/hooks/useResource';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import ContratoFormModal from './components/ContratoFormModal';

type Contrato = {
    contrato_id: number;
    user_id: number;
    tipo_contrato: string;
    sueldo_base: number;
    horas_semanales: number;
    hora_entrada: string;
    hora_salida: string;
    minutos_tolerancia: number;
    fecha_inicio: string;
    fecha_fin: string | null;
    estado: 'activo' | 'suspendido' | 'finalizado';
    user: {
        id: number;
        name: string;
        nombre_completo: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'RH', href: '#' },
    { title: 'Contratos', href: '/rh/contratos' },
];

const estadoBadge = (estado: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
        activo: 'success',
        suspendido: 'warning',
        finalizado: 'destructive',
    };
    return <Badge variant={variants[estado] || 'default'}>{estado.toUpperCase()}</Badge>;
};

const tipoContratoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
        tiempo_completo: 'Tiempo Completo',
        medio_tiempo: 'Medio Tiempo',
        por_horas: 'Por Horas',
        practicante: 'Practicante',
    };
    return labels[tipo] || tipo;
};

export default function ContratosPage() {
    const res = useResource<Contrato>('/rh/contratos');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Contrato | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Contrato | null>(null);

    const openCreate = () => {
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (c: Contrato) => {
        setEditing(c);
        setOpen(true);
    };

    const confirmDeleteAction = async () => {
        if (confirmDelete) {
            await res.remove(confirmDelete.contrato_id);
            setConfirmDelete(null);
        }
    };

    const columns: Column<Contrato>[] = [
        { label: '#', render: (_c, i) => ((res.rows?.current_page || 1) - 1) * (res.rows?.per_page || 15) + (i || 0) + 1 },
        { label: 'Trabajador', render: (c) => c.user?.nombre_completo || c.user?.name || '—' },
        { label: 'Tipo', render: (c) => tipoContratoLabel(c.tipo_contrato) },
        { label: 'Sueldo', render: (c) => `S/ ${c.sueldo_base.toFixed(2)}` },
        { label: 'Horario', render: (c) => c.hora_entrada && c.hora_salida ? `${c.hora_entrada.substring(0, 5)} - ${c.hora_salida.substring(0, 5)}` : '—' },
        { label: 'Tolerancia', render: (c) => `${c.minutos_tolerancia} min` },
        { label: 'Estado', render: (c) => estadoBadge(c.estado) },
        { label: 'Acciones', render: (c) => <Actions c={c} onEdit={openEdit} onDelete={setConfirmDelete} /> },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contratos - RH" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <PageHeader
                        icon={Briefcase}
                        title="Contratos de Personal"
                        subtitle="Gestión de contratos laborales"
                        iconColor="bg-purple-600"
                    />
                    <Button onClick={openCreate} className="bg-[#00a65a] hover:bg-[#008d4c] text-white">
                        + Nuevo Contrato
                    </Button>
                </div>

                {res.rows && (
                    <ResourceTable
                        rows={res.rows}
                        columns={columns}
                        getKey={(c) => c.contrato_id}
                        onPageChange={res.setPage}
                    />
                )}
                {res.loading && (
                    <div className="py-8 text-center text-sm text-gray-400 animate-pulse">Cargando...</div>
                )}
            </div>

            <ContratoFormModal
                open={open}
                onClose={() => setOpen(false)}
                editing={editing}
                onSuccess={() => {
                    setOpen(false);
                    res.refresh();
                }}
            />

            <ConfirmModal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={confirmDeleteAction}
                title="Eliminar Contrato"
                message={confirmDelete ? `¿Eliminar contrato de ${confirmDelete.user?.nombre_completo}?` : ''}
                confirmText="Eliminar"
                variant="danger"
            />
        </AppLayout>
    );
}

function Actions({ c, onEdit, onDelete }: {
    c: Contrato;
    onEdit: (c: Contrato) => void;
    onDelete: (c: Contrato) => void;
}) {
    return (
        <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(c)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(c)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
