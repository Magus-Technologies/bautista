import { Head } from '@inertiajs/react';
import { Tag, PlusCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/shared/PageHeader';
import SectionCard from '@/components/shared/SectionCard';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import ConfirmModal from '@/components/shared/ConfirmModal';
import AlertModal from '@/components/shared/AlertModal';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type { BreadcrumbItem } from '@/types';
import ConceptoPagoFormModal from './components/ConceptoPagoFormModal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pagos', href: '/pagos' },
    { title: 'Conceptos de Pago', href: '/conceptos-pago' },
];

export interface ConceptoPago {
    concepto_id: number;
    nombre: string;
    descripcion: string | null;
    periodicidad: 'mensual' | 'anual' | 'unico';
    opcional: boolean;
    activo: boolean;
}

const PERIODICIDAD_LABEL: Record<string, string> = {
    mensual: 'Mensual',
    anual:   'Anual',
    unico:   'Único',
};

const PERIODICIDAD_COLOR: Record<string, string> = {
    mensual: 'bg-blue-100 text-blue-700',
    anual:   'bg-purple-100 text-purple-700',
    unico:   'bg-gray-100 text-gray-700',
};

function toPaginated<T>(data: T[]) {
    return { data, current_page: 1, last_page: 1, per_page: data.length, total: data.length, from: 1, to: data.length };
}

export default function ConceptoPagoPage() {
    const [conceptos, setConceptos]   = useState<ConceptoPago[]>([]);
    const [loading, setLoading]       = useState(true);
    const [modalOpen, setModalOpen]   = useState(false);
    const [editing, setEditing]       = useState<ConceptoPago | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<ConceptoPago | null>(null);
    const [deleting, setDeleting]     = useState(false);
    const [errorAlert, setErrorAlert] = useState('');

    const cargar = async () => {
        setLoading(true);
        try {
            const res = await api.get('/conceptos-pago');
            setConceptos(res.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const openNew  = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (c: ConceptoPago) => { setEditing(c); setModalOpen(true); };

    const toggleEstado = async (c: ConceptoPago) => {
        await api.patch(`/conceptos-pago/${c.concepto_id}/estado`);
        cargar();
    };

    const eliminar = async (c: ConceptoPago) => {
        setConfirmDelete(c);
    };

    const confirmarEliminar = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            await api.delete(`/conceptos-pago/${confirmDelete.concepto_id}`);
            setConfirmDelete(null);
            cargar();
        } catch (e: any) {
            setConfirmDelete(null);
            setErrorAlert(e?.response?.data?.message ?? 'Error al eliminar el concepto.');
        } finally {
            setDeleting(false);
        }
    };
    const columns: Column<ConceptoPago>[] = [
        { label: '#', render: (_, i) => <span className="text-gray-400 font-bold tabular-nums">{(i ?? 0) + 1}</span> },
        { label: 'Nombre',       render: c => <span className="font-semibold">{c.nombre}</span> },
        { label: 'Descripción',  render: c => <span className="text-gray-500 text-xs">{c.descripcion ?? '—'}</span> },
        {
            label: 'Periodicidad',
            render: c => (
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${PERIODICIDAD_COLOR[c.periodicidad]}`}>
                    {PERIODICIDAD_LABEL[c.periodicidad]}
                </span>
            ),
        },
        {
            label: 'Opcional',
            render: c => c.opcional
                ? <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Opcional</span>
                : <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Obligatorio</span>,
        },
        {
            label: 'Estado',
            render: c => (
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                </span>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Conceptos de Pago" />
            <div className="flex flex-col gap-6 p-4 sm:p-6">

                <div className="flex items-center justify-between">
                    <PageHeader
                        icon={Tag}
                        title="Conceptos de Pago"
                        subtitle="Tipos de cobro configurables por institución"
                        iconColor="bg-blue-600"
                    />
                    <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        <PlusCircle className="size-4" />
                        Nuevo concepto
                    </Button>
                </div>

                <SectionCard title={`${conceptos.length} conceptos registrados`}>
                    <ResourceTable
                        rows={toPaginated(conceptos)}
                        columns={columns}
                        getKey={c => c.concepto_id}
                        loading={loading}
                        onEdit={openEdit}
                        onDelete={eliminar}
                        extraActions={c => (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-7"
                                onClick={() => toggleEstado(c)}
                                title={c.activo ? 'Desactivar' : 'Activar'}
                            >
                                {c.activo
                                    ? <ToggleRight className="size-4 text-emerald-500" />
                                    : <ToggleLeft className="size-4 text-gray-400" />
                                }
                            </Button>
                        )}
                    />
                </SectionCard>
            </div>

            <ConceptoPagoFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editing={editing}
                onSaved={cargar}
            />

            <ConfirmModal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={confirmarEliminar}
                title="Eliminar concepto"
                message={`¿Eliminar el concepto "${confirmDelete?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
                processing={deleting}
            />

            <AlertModal
                open={!!errorAlert}
                onClose={() => setErrorAlert('')}
                variant="error"
                title="No se puede eliminar"
                message={errorAlert}
            />
        </AppLayout>
    );
}
