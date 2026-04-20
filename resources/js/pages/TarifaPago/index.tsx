import { Head } from '@inertiajs/react';
import { DollarSign, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/shared/PageHeader';
import SectionCard from '@/components/shared/SectionCard';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type { BreadcrumbItem } from '@/types';
import TarifaPagoFormModal from './components/TarifaPagoFormModal';
import type { ConceptoPago } from '../ConceptoPago/index';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pagos', href: '/pagos' },
    { title: 'Tarifas', href: '/tarifas-pago' },
];

export interface TarifaPago {
    tarifa_id: number;
    concepto_id: number;
    grado_id: number | null;
    anio_escolar: number | string;
    monto: string;
    activo: boolean;
    concepto?: { nombre: string; periodicidad: string };
    grado?: { nombre_grado: string } | null;
}

function toPaginated<T>(data: T[]) {
    return { data, current_page: 1, last_page: 1, per_page: data.length, total: data.length, from: 1, to: data.length };
}

export default function TarifaPagoPage() {
    const [tarifas, setTarifas]     = useState<TarifaPago[]>([]);
    const [conceptos, setConceptos] = useState<ConceptoPago[]>([]);
    const [loading, setLoading]     = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<TarifaPago | null>(null);
    const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());

    const cargar = async () => {
        setLoading(true);
        try {
            const [tRes, cRes] = await Promise.all([
                api.get('/tarifas-pago'),
                api.get('/conceptos-pago'),
            ]);
            setTarifas(tRes.data);
            setConceptos(cRes.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const openNew  = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (t: TarifaPago) => { setEditing(t); setModalOpen(true); };

    const tarifasFiltradas = tarifas.filter(t => Number(t.anio_escolar) === filtroAnio);
    const anios = [...new Set(tarifas.map(t => Number(t.anio_escolar)))].sort((a, b) => b - a);
    if (!anios.includes(filtroAnio)) anios.unshift(filtroAnio);

    const columns: Column<TarifaPago>[] = [
        { label: 'Concepto', render: t => <span className="font-semibold">{t.concepto?.nombre ?? `Concepto #${t.concepto_id}`}</span> },
        { label: 'Grado',    render: t => t.grado?.nombre_grado ?? <span className="italic text-gray-400">General</span> },
        { label: 'Año',      render: t => t.anio_escolar },
        { label: 'Monto',    render: t => <span className="font-bold">S/ {Number(t.monto).toFixed(2)}</span> },
        {
            label: 'Estado',
            render: t => (
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${t.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {t.activo ? 'Activa' : 'Inactiva'}
                </span>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tarifas de Pago" />
            <div className="flex flex-col gap-6 p-4 sm:p-6">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <PageHeader
                        icon={DollarSign}
                        title="Tarifas de Pago"
                        subtitle="Precio por concepto, grado y año escolar"
                        iconColor="bg-purple-600"
                    />
                    <div className="flex items-center gap-2">
                        <select
                            value={filtroAnio}
                            onChange={e => setFiltroAnio(Number(e.target.value))}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            {anios.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <Button onClick={openNew} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                            <PlusCircle className="size-4" />
                            Nueva tarifa
                        </Button>
                    </div>
                </div>

                <SectionCard title={`Tarifas ${filtroAnio} — ${tarifasFiltradas.length} registros`}>
                    {loading ? (
                        <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
                    ) : tarifasFiltradas.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-400">Sin tarifas para {filtroAnio}. Crea la primera.</p>
                    ) : (
                        <ResourceTable
                            rows={toPaginated(tarifasFiltradas)}
                            columns={columns}
                            getKey={t => t.tarifa_id}
                            onEdit={openEdit}
                        />
                    )}
                </SectionCard>
            </div>

            <TarifaPagoFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editing={editing}
                conceptos={conceptos}
                onSaved={cargar}
            />
        </AppLayout>
    );
}
