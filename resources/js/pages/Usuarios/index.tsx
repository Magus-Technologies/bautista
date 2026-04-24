import { Head } from '@inertiajs/react';
import { Users, ShieldCheck, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import ResourceTable from '@/components/shared/ResourceTable';
import SectionCard from '@/components/shared/SectionCard';
import { useResource } from '@/hooks/useResource';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePermission } from '@/hooks/usePermission';
import UsuarioFormModal from './components/UsuarioFormModal';
import AccessControlManager from './components/AccessControlManager';
import type { Usuario } from './hooks/useUsuarios';
import { usuariosColumns } from './hooks/useUsuariosColumns';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Usuarios y Seguridad', href: '/usuarios' },
];

export default function UsuariosPage() {
    const res = useResource<Usuario>('/usuarios');
    const { can } = usePermission();
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<Usuario | null>(null);

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (u: Usuario) => {
        setEditing(u);
        setModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios y Seguridad" />
            
            <div className="p-4 sm:p-6 space-y-6">
                <Tabs defaultValue="listado" className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Gestión de Acceso</h1>
                            <p className="text-sm text-gray-500 font-medium">Administra quiénes entran al sistema y qué pueden hacer.</p>
                        </div>
                        <TabsList className="bg-gray-100/80 p-1 rounded-xl">
                            <TabsTrigger value="listado" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                                <Users className="size-3 mr-2 text-indigo-600" /> USUARIOS
                            </TabsTrigger>
                            {can('seguridad.roles.ver') && (
                                <TabsTrigger value="seguridad" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                                    <ShieldCheck className="size-3 mr-2 text-indigo-600" /> ROLES Y PERMISOS
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    <TabsContent value="listado" className="mt-0 border-none shadow-none bg-transparent outline-none">
                        {res.success && (
                            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 mb-4">
                                {res.success}
                            </div>
                        )}
                        
                        <SectionCard title={`Listado de Usuarios ${res.rows ? `(${res.rows.total})` : ''}`}>
                            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex w-full sm:w-auto gap-2">
                                    <Input
                                        value={res.search}
                                        onChange={(e) => res.setSearch(e.target.value)}
                                        placeholder="Buscar usuarios..."
                                        className="flex-1 sm:w-64"
                                    />
                                    <Button variant="outline" size="icon" className="shrink-0">
                                        <Search className="size-4" />
                                    </Button>
                                </div>
                                {can('seguridad.usuarios.crear') && (
                                    <Button onClick={openCreate} className="bg-[#00a65a] flex-1 sm:flex-none hover:bg-[#008d4c] text-white gap-2">
                                        <Plus className="size-4" />
                                        Nuevo Usuario
                                    </Button>
                                )}
                            </div>
                            
                            {res.rows && (
                                <ResourceTable
                                    rows={res.rows}
                                    columns={usuariosColumns}
                                    getKey={(u) => u.id}
                                    onEdit={can('seguridad.usuarios.editar') ? openEdit : undefined}
                                    onLoadMore={res.loadMore}
                                    hasMore={res.hasMore}
                                    loading={res.loading}
                                />
                            )}
                            {res.loading && !res.rows && (
                                <p className="py-6 text-center text-sm text-gray-400 font-medium italic">
                                    Sincronizando base de datos...
                                </p>
                            )}
                        </SectionCard>
                    </TabsContent>

                    {can('seguridad.roles.ver') && (
                        <TabsContent value="seguridad" className="mt-0 border-none shadow-none bg-transparent outline-none">
                            <AccessControlManager />
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            <UsuarioFormModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    res.clearSuccess();
                }}
                editing={editing}
                onSave={editing
                    ? (data) => res.update(editing.id, data)
                    : (data) => res.create(data)}
                apiErrors={res.apiErrors}
                clearErrors={res.clearErrors}
            />
        </AppLayout>
    );
}
