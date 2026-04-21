import { Head, usePage } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import ResourcePage from '@/components/shared/ResourcePage';
import ResourceTable from '@/components/shared/ResourceTable';
import { useOptions } from '@/hooks/useOptions';
import { useResource } from '@/hooks/useResource';
import type { BreadcrumbItem } from '@/types';
import GradoFormModal from './components/GradoFormModal';
import type { Grado, Nivel } from './hooks/useGrados';
import { gradosColumns } from './hooks/useGradosColumns';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Grados', href: '/grados' },
];

export default function GradosPage() {
    const { url } = usePage();
    const queryParams = useMemo(() => new URLSearchParams(url.split('?')[1] || ''), [url]);
    const queryNivelId = queryParams.get('nivel_id');

    const res = useResource<Grado>('/grados', queryNivelId ? { nivel_id: queryNivelId } : {});
    const niveles = useOptions<Nivel>('/niveles');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Grado | null>(null);

    const openCreate = () => {
        setEditing(null); setModalOpen(true);
    };
    const openEdit = (g: Grado) => {
        setEditing(g); setModalOpen(true);
    };
    const handleDelete = (g: Grado) => {
        if (confirm(`¿Eliminar el grado "${g.nombre_grado}"?`)) {
            res.remove(g.grado_id);
        }
    };

    return (
        <>
            <Head title="Grados" />
            <ResourcePage
                breadcrumbs={breadcrumbs}
                pageTitle="Grados"
                subtitle={res.rows ? `${res.rows.total} grados en este nivel` : '…'}
                icon={GraduationCap}
                iconColor="bg-blue-600"
                search={res.search}
                onSearch={res.setSearch}
                flashSuccess={res.success}
                btnLabel="Nuevo Grado"
                onNew={openCreate}
            >
                {queryNivelId && (
                    <div className="mb-4 flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-800">
                            <span className="text-sm font-medium">Filtrando por Nivel ID: </span>
                            <span className="font-bold">{queryNivelId}</span>
                        </div>
                        <button
                            onClick={() => window.location.href = '/grados'}
                            className="text-xs text-blue-600 hover:underline font-bold"
                        >
                            Ver todos los grados
                        </button>
                    </div>
                )}
                {res.rows && (
                    <ResourceTable
                        rows={res.rows}
                        columns={gradosColumns}
                        getKey={(g) => g.grado_id}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onPageChange={res.setPage}
                    />
                )}
                {res.loading && <p className="py-6 text-center text-sm text-gray-400">Cargando...</p>}
            </ResourcePage>

            <GradoFormModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false); res.clearSuccess();
                }}
                editing={editing}
                niveles={niveles}
                defaultNivelId={queryNivelId ?? undefined}
                onSave={editing
                    ? (data) => res.update(editing.grado_id, data)
                    : (data) => res.create(data)}
                apiErrors={res.apiErrors}
                clearErrors={res.clearErrors}
            />
        </>
    );
}
