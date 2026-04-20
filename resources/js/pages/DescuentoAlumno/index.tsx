import { Head } from '@inertiajs/react';
import { Gift, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/shared/PageHeader';
import SectionCard from '@/components/shared/SectionCard';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type { BreadcrumbItem } from '@/types';
import DescuentoFormModal from './components/DescuentoFormModal';
import type { ConceptoPago } from '../ConceptoPago/index';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pagos', href: '/pagos' },
    { title: 'Descuentos y Becas', href: '/descuentos' },
];

export interface DescuentoAlumno {
    descuento_id: number;
    estu_id: number;
    concepto_id: number | null;
    motivo: 'hermanos' | 'merito' | 'beca' | 'otro';
    tipo: 'porcentaje' | 'monto_fijo';
    valor: string;
    fecha_inicio: string;
    fecha_fin: string | null;
    observacion: string | null;
    activo: boolean;
    estudiante?: { perfil?: { primer_nombre: string; primer_apellido: string } };
    concepto?: { nombre: string } | null;
}

const MOTIVO_LABEL: Record<string, string> = {
    hermanos: 'Hermanos', merito: 'Mérito', beca: 'Beca', otro: 'Otro',
};
const MOTIVO_COLOR: Record<string, string> = {
    hermanos: 'bg-blue-100 text-blue-700',
    merito:   'bg-yellow-100 text-yellow-700',
    beca:     'bg-purple-100 text-purple-700',
    otro:     'bg-gray-100 text-gray-700',
};

function toPaginated<T>(data: T[]) {
    return { data, current_page: 1, last_page: 1, per_page: data.length, total: data.length, from: 1, to: data.length };
}

export default function DescuentoAlumnoPage() {
    const [descuentos, setDescuentos] = useState<DescuentoAlumno[]>([]);
    const [conceptos, setConceptos]   = useState<ConceptoPago[]>([]);
    const [loading, setLoading]       = useState(true);
    const [modalOpen, setModalOpen]   = useState(false);
    const [editing, setEditing]       = useState<DescuentoAlumno | null>(null);
    const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos'>('activos');

    const cargar = async () => {
        setLoading(true);
        try {
            const [dRes, cRes] = await Promise.all([
                api.get('/descuentos'),
                api.get('/conceptos-pago'),
            ]);
            setDescuentos(dRes.data);
            setConceptos(cRes.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const openNew  = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (d: DescuentoAlumno) => { setEditing(d); setModalOpen(true); };

    const eliminar = async (d: DescuentoAlumno) => {
        if (!confirm(`¿Eliminar descuento de ${d.estudiante?.perfil?.primer_nombre ?? 'este alumno'}?`)) return;
        await api.delete(`/descuentos/${d.descuento_id}`);
        cargar();
    };

    const lista = filtroActivo === 'activos' ? descuentos.filter(d => d.activo) : descuentos;

    const nombreAlumno = (d: DescuentoAlumno) =>
        d.estudiante?.perfil
            ? `${d.estudiante.perfil.primer_nombre} ${d.estudiante.perfil.primer_apellido}`
            : `Est. #${d.estu_id}`;

    const columns: Column<DescuentoAlumno>[] = [
        { label: '#', render: (_, i) => <span className="text-gray-400 font-bold tabular-nums">{(i ?? 0) + 1}</span> },
        { label: 'Alumno',    render: d => <span className="font-semibold">{nombreAlumno(d)}</span> },
        { label: 'Concepto',  render: d => <span className="text-xs">{d.concepto?.nombre ?? <span className="italic text-gray-400">General</span>}</span> },
        {
            label: 'Motivo',
            render: d => (
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${MOTIVO_COLOR[d.motivo]}`}>
                    {MOTIVO_LABEL[d.motivo]}
                </span>
            ),
        },
        {
            label: 'Descuento',
            render: d => (
                <span className="font-bold">
                    {d.tipo === 'porcentaje' ? `${Number(d.valor)}%` : `S/ ${Number(d.valor).toFixed(2)}`}
                </span>
            ),
        },
        {
            label: 'Vigencia',
            render: d => (
                <span className="text-xs text-gray-500">
                    {d.fecha_inicio}
                    {d.fecha_fin ? ` → ${d.fecha_fin}` : <span className="text-emerald-600 font-medium"> Indefinido</span>}
                </span>
            ),
        },
        {
            label: 'Estado',
            render: d => (
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${d.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {d.activo ? 'Activo' : 'Inactivo'}
                </span>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Descuentos y Becas" />
            <div className="flex flex-col gap-6 p-4 sm:p-6">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <PageHeader
                        icon={Gift}
                        title="Descuentos y Becas"
                        subtitle="Descuentos individuales por alumno — porcentaje o monto fijo"
                        iconColor="bg-rose-600"
                    />
                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                            {(['activos', 'todos'] as const).map(f => (
                                <button key={f} onClick={() => setFiltroActivo(f)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${filtroActivo === f ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                                    {f === 'activos' ? 'Activos' : 'Todos'}
                                </button>
                            ))}
                        </div>
                        <Button onClick={openNew} className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
                            <PlusCircle className="size-4" />
                            Nuevo descuento
                        </Button>
                    </div>
                </div>

                <SectionCard title={`${lista.length} descuentos${filtroActivo === 'activos' ? ' activos' : ''}`}>
                    {loading ? (
                        <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
                    ) : lista.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-400">Sin descuentos registrados.</p>
                    ) : (
                        <ResourceTable
                            rows={toPaginated(lista)}
                            columns={columns}
                            getKey={d => d.descuento_id}
                            onEdit={openEdit}
                            onDelete={eliminar}
                        />
                    )}
                </SectionCard>
            </div>

            <DescuentoFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editing={editing}
                conceptos={conceptos}
                onSaved={cargar}
            />
        </AppLayout>
    );
}
