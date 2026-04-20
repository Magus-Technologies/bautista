import { Head, usePage } from '@inertiajs/react';
import { Inbox, Plus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import type { BreadcrumbItem } from '@/types';
import BandejaEntrada from './components/BandejaEntrada';
import Conversacion from './components/Conversacion';
import CrearGrupoModal from './components/CrearGrupoModal';
import EnviarMensajeModal from './components/EnviarMensajeModal';
import { usePermission } from '@/hooks/usePermission';

type Mensaje = {
    id:          number;
    asunto:      string;
    cuerpo:      string;
    leido:       boolean;
    created_at:  string;
    remitente:   { id: number; nombre: string; foto?: string | null } | null;
    grupo:       { id: number; nombre: string; foto?: string | null } | null;
};
type Paginated<T> = { data: T[]; current_page: number; last_page: number; total: number; from: number; to: number };
type Grupo = { id: number; nombre: string; foto?: string | null };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard',   href: '/dashboard' },
    { title: 'Comunicados', href: '/comunicados' },
];


export default function MensajesPage() {
    const { auth } = usePage<{ auth: { user: { id: number } } }>().props;
    const { can } = usePermission();

    const [mensajes, setMensajes]           = useState<Paginated<Mensaje> | null>(null);
    const [loading, setLoading]             = useState(false);
    const [page, setPage]                   = useState(1);
    const [noLeidos, setNoLeidos]           = useState(0);
    const [grupos, setGrupos]               = useState<Grupo[]>([]);
    const [seleccionado, setSeleccionado]   = useState<number | null>(null);
    const [modalEnviar, setModalEnviar]     = useState(false);
    const [modalGrupo, setModalGrupo]       = useState(false);

    const cargarBandeja = useCallback(async () => {
        setLoading(true);

        try {
            const { data } = await api.get('/mensajes', { params: { page } });
            setMensajes(data);
        } finally {
            setLoading(false);
        }
    }, [page]);

    const cargarGrupos = async () => {
        const { data } = await api.get('/mensajeria/grupos');
        setGrupos(data);
    };

    const cargarNoLeidos = async () => {
        const { data } = await api.get('/mensajes/no-leidos');
        setNoLeidos(data.count);
    };

    useEffect(() => {
        cargarBandeja();
        cargarNoLeidos();
    }, [cargarBandeja]);

    useEffect(() => {
 cargarGrupos(); 
}, []);

    const handleSelectMensaje = (id: number) => {
        setSeleccionado(id);
        // Marcar como leído en la lista local
        setMensajes((prev) => prev ? {
            ...prev,
            data: prev.data.map((m) => m.id === id ? { ...m, leido: true } : m),
        } : prev);
        setNoLeidos((prev) => Math.max(0, prev - 1));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mensajes" />

            <div className="flex h-[calc(100vh-8rem)] flex-col gap-2 md:gap-4 p-2 sm:p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500">
                            <Inbox className="size-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Mensajes</h1>
                            {noLeidos > 0 && (
                                <p className="text-xs text-blue-600">{noLeidos} no leído{noLeidos !== 1 ? 's' : ''}</p>
                            )}
                        </div>
                    </div>
                    {can('admin.comunicados.crear') && (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={() => setModalGrupo(true)}
                                variant="outline"
                                className="gap-2"
                            >
                                <Users className="size-4" />
                                Nuevo Grupo
                            </Button>
                            <Button
                                onClick={() => setModalEnviar(true)}
                                className="gap-2 bg-[#00a65a] hover:bg-[#008d4c] text-white"
                            >
                                <Plus className="size-4" />
                                Nueva Notificación
                            </Button>
                        </div>
                    )}
                </div>

                {/* Layout 2 columnas */}
                <div className="flex flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white relative">
                    {/* Sidebar izquierdo (Lista de mensajes) */}
                    <div className={`${seleccionado ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 border-r border-gray-100 overflow-hidden flex-col`}>
                        <BandejaEntrada
                            mensajes={mensajes}
                            loading={loading}
                            onSelect={handleSelectMensaje}
                            onRefresh={cargarBandeja}
                            onPageChange={setPage}
                        />
                    </div>

                    {/* Panel derecho (Chat Abierto) */}
                    <div className={`${!seleccionado ? 'hidden md:flex' : 'flex'} flex-1 overflow-hidden flex-col w-full bg-[#f0f2f5]`}>
                        {seleccionado ? (
                            <Conversacion
                                mensajeId={seleccionado}
                                userId={auth.user.id}
                                onBack={() => setSeleccionado(null)}
                            />
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
                                <Inbox className="size-12" />
                                <p className="text-sm">Selecciona un mensaje para verlo</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <EnviarMensajeModal
                open={modalEnviar}
                onClose={() => setModalEnviar(false)}
                onSent={() => {
 cargarBandeja(); cargarNoLeidos(); 
}}
                grupos={grupos}
            />
            <CrearGrupoModal
                open={modalGrupo}
                onClose={() => setModalGrupo(false)}
                onSaved={cargarGrupos}
            />
        </AppLayout>
    );
}
