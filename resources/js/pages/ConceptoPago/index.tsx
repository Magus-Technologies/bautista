import { Head } from '@inertiajs/react';
import { Tag, PlusCircle, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/shared/PageHeader';
import SectionCard from '@/components/shared/SectionCard';
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

export default function ConceptoPagoPage() {
    const [conceptos, setConceptos]   = useState<ConceptoPago[]>([]);
    const [loading, setLoading]       = useState(true);
    const [modalOpen, setModalOpen]   = useState(false);
    const [editing, setEditing]       = useState<ConceptoPago | null>(null);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await api.get('/conceptos-pago');
            setConceptos(res.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const openNew  = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (c: ConceptoPago) => { setEditing(c); setModalOpen(true); };

    const toggleEstado = async (c: ConceptoPago) => {
        await api.patch(`/conceptos-pago/${c.concepto_id}/estado`);
        fetch();
    };

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
                    {loading ? (
                        <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
                    ) : conceptos.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-400">Sin conceptos registrados. Crea el primero.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="pb-3 pr-4">Nombre</th>
                                        <th className="pb-3 pr-4">Descripción</th>
                                        <th className="pb-3 pr-4 text-center">Periodicidad</th>
                                        <th className="pb-3 pr-4 text-center">Estado</th>
                                        <th className="pb-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {conceptos.map(c => (
                                        <tr key={c.concepto_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 pr-4 font-semibold text-gray-800">{c.nombre}</td>
                                            <td className="py-3 pr-4 text-gray-500 text-xs max-w-xs truncate">
                                                {c.descripcion ?? '—'}
                                            </td>
                                            <td className="py-3 pr-4 text-center">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${PERIODICIDAD_COLOR[c.periodicidad]}`}>
                                                    {PERIODICIDAD_LABEL[c.periodicidad]}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-4 text-center">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                                    {c.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(c)}>
                                                        <Pencil className="size-3.5 text-gray-500" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toggleEstado(c)}>
                                                        {c.activo
                                                            ? <ToggleRight className="size-4 text-emerald-500" />
                                                            : <ToggleLeft className="size-4 text-gray-400" />
                                                        }
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>
            </div>

            <ConceptoPagoFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editing={editing}
                onSaved={fetch}
            />
        </AppLayout>
    );
}
