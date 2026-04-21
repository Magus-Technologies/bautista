import { Head } from '@inertiajs/react';
import { Gift, PlusCircle, Ban, CheckCircle, User, Layers, GraduationCap } from 'lucide-react';
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
import ConfirmModal from '@/components/shared/ConfirmModal';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import type { ConceptoPago } from '../ConceptoPago/index';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pagos', href: '/pagos' },
    { title: 'Descuentos y Becas', href: '/descuentos' },
];

export interface DescuentoAlumno {
    descuento_id: number;
    estu_id: number | null;
    nivel_id: number | null;
    grado_id: number | null;
    seccion_id: number | null;
    concepto_id: number | null;
    motivo: 'hermanos' | 'merito' | 'beca' | 'otro';
    tipo: 'porcentaje' | 'monto_fijo';
    valor: string;
    fecha_inicio: string;
    fecha_fin: string | null;
    observacion: string | null;
    activo: boolean;
    estudiante?: { perfil?: { primer_nombre: string; apellido_paterno: string; apellido_materno?: string } };
    nivel?: { nombre_nivel: string };
    grado?: { nombre_grado: string };
    seccion?: { nombre_seccion: string };
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

    // Modales de confirmación
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
    const [selected, setSelected] = useState<DescuentoAlumno | null>(null);
    const [processing, setProcessing] = useState(false);

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

    const openDelete = (d: DescuentoAlumno) => { setSelected(d); setConfirmDeleteOpen(true); };
    const openToggle = (d: DescuentoAlumno) => { setSelected(d); setConfirmToggleOpen(true); };

    const confirmarEliminar = async () => {
        if (!selected) return;
        setProcessing(true);
        try {
            await api.delete(`/descuentos/${selected.descuento_id}`);
            setConfirmDeleteOpen(false);
            cargar();
        } finally {
            setProcessing(false);
        }
    };

    const confirmarToggle = async () => {
        if (!selected) return;
        setProcessing(true);
        try {
            await api.put(`/descuentos/${selected.descuento_id}`, {
                ...selected,
                activo: !selected.activo
            });
            setConfirmToggleOpen(false);
            cargar();
        } finally {
            setProcessing(false);
        }
    };

    const lista = filtroActivo === 'activos' ? descuentos.filter(d => d.activo) : descuentos;

    const nombreAplicable = (d: DescuentoAlumno | null) => {
        if (!d) return '';
        if (d.estudiante) {
            return d.estudiante.perfil
                ? `${d.estudiante.perfil.primer_nombre} ${d.estudiante.perfil.apellido_paterno} ${d.estudiante.perfil.apellido_materno ?? ''}`.trim()
                : `Est. #${d.estu_id}`;
        }
        if (d.nivel) return `Nivel: ${d.nivel.nombre_nivel}`;
        if (d.grado) return `Grado: ${d.grado.nombre_grado}`;
        return 'General';
    };

    const columns: Column<DescuentoAlumno>[] = [
        { label: '#', render: (_, i) => <span className="text-gray-400 font-bold tabular-nums">{(i ?? 0) + 1}</span> },
        { 
            label: 'Aplicable a', 
            render: d => {
                const Icon = d.estu_id ? User : d.nivel_id ? Layers : GraduationCap;
                const color = d.estu_id ? 'text-blue-600' : d.nivel_id ? 'text-purple-600' : 'text-amber-600';
                const bgColor = d.estu_id ? 'bg-blue-50' : d.nivel_id ? 'bg-purple-50' : 'bg-amber-50';
                
                return (
                    <div className="flex items-center gap-3 text-left">
                        <div className={`p-2 rounded-lg ${bgColor} ${color}`}>
                            <Icon className="size-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 leading-tight">{nombreAplicable(d)}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>
                                {d.estu_id ? 'Alumno Individual' : d.nivel_id ? 'Nivel Educativo' : 'Grado Académico'}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        { label: 'Concepto',  render: d => <span className="text-xs font-medium text-gray-600 px-2 py-1 bg-gray-50 rounded-md border border-gray-100">{d.concepto?.nombre ?? 'General'}</span> },
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
                <span className="text-xs text-gray-500 whitespace-nowrap">
                    {d.fecha_inicio.split('T')[0]}
                    {d.fecha_fin ? ` → ${d.fecha_fin.split('T')[0]}` : <span className="text-emerald-600 font-medium"> Indefinido</span>}
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
                            onDelete={openDelete}
                            extraActions={d => (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={`size-7 ${d.activo ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                    onClick={() => openToggle(d)}
                                    title={d.activo ? 'Desactivar' : 'Activar'}
                                >
                                    {d.activo ? <Ban className="size-3.5" /> : <CheckCircle className="size-3.5" />}
                                </Button>
                            )}
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

            <ConfirmDeleteModal
                open={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={confirmarEliminar}
                title="Eliminar Descuento"
                message={`¿Estás seguro de eliminar el descuento de ${nombreAplicable(selected!)}? Esta acción no se puede deshacer.`}
                processing={processing}
            />

            <ConfirmModal
                open={confirmToggleOpen}
                onClose={() => setConfirmToggleOpen(false)}
                onConfirm={confirmarToggle}
                title={selected?.activo ? 'Desactivar Descuento' : 'Activar Descuento'}
                message={`¿Deseas ${selected?.activo ? 'desactivar' : 'activar'} el descuento de ${nombreAplicable(selected!)}?`}
                confirmText={selected?.activo ? 'Desactivar' : 'Activar'}
                variant={selected?.activo ? 'warning' : 'default'}
                processing={processing}
            />
        </AppLayout>
    );
}
