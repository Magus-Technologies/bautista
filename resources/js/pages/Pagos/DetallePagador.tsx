import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Wallet, CreditCard, Clock, Calendar, FileText, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PagoFormModal from './components/PagoFormModal';
import ComprobanteModal from './components/ComprobanteModal';
import EnviarComprobanteModal from './components/EnviarComprobanteModal';
import axios from 'axios';
import type { Pago } from './hooks/usePago';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/shared/PageHeader';
import PageTabs from '@/components/shared/PageTabs';
import ResourceTable, { Column, Paginated } from '@/components/shared/ResourceTable';
import type { BreadcrumbItem } from '@/types';

interface Concepto {
    concepto_id: number;
    nombre: string;
    unico: boolean;
    periodicidad: 'mensual' | 'anual' | 'unico';
}

interface Pagador {
    id_contacto: number;
    nombres: string;
    apellidos: string;
    numero_doc: string;
    telefono_1: string;
    estudiante_id?: number;
    grado?: string;
    seccion?: string;
}

interface Props {
    pagador: Pagador;
    pagos: Pago[] | { data: Pago[] };
    conceptos: Concepto[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pagos', href: '/pagos' },
    { title: 'Detalle de Pagador', href: '#' },
];

export default function DetallePagador({ pagador, pagos: pagosData, conceptos }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
    const [apiErrors, setApiErrors] = useState<Record<string, string[]>>({});

    const [comprobanteOpen, setComprobanteOpen] = useState(false);
    const [pagosParaComprobante, setPagosParaComprobante] = useState<Pago[]>([]);
    const [comprobanteInicial, setComprobanteInicial] = useState<any>(undefined);

    const [enviarModalOpen, setEnviarModalOpen] = useState(false);
    const [comprobanteIdParaEnviar, setComprobanteIdParaEnviar] = useState<number | null>(null);

    const pagos = useMemo(() => {
        const raw = pagosData as any;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw.data && Array.isArray(raw.data)) return raw.data;
        if (raw.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
        return [];
    }, [pagosData]);

    const conceptoPeriodicidadMap = useMemo(() => {
        const map: Record<number, string> = {};
        conceptos.forEach(c => { map[c.concepto_id] = c.periodicidad; });
        return map;
    }, [conceptos]);

    const pagosMensuales = useMemo(() =>
        pagos.filter((p: Pago) => conceptoPeriodicidadMap[Number(p.concepto_id)] === 'mensual'),
        [pagos, conceptoPeriodicidadMap]
    );

    const pagosUnicos = useMemo(() =>
        pagos.filter((p: Pago) => {
            const per = conceptoPeriodicidadMap[Number(p.concepto_id)];
            return per === 'unico' || per === 'anual';
        }),
        [pagos, conceptoPeriodicidadMap]
    );

    const handleEdit = (pago: Pago) => {
        setSelectedPago(pago);
        setModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedPago(null);
        setModalOpen(true);
    };

    const openComprobanteModal = (pago: Pago) => {
        setPagosParaComprobante([pago]);
        setComprobanteInicial(undefined);
        setComprobanteOpen(true);
    };

    const openComprobanteExistente = async (pago: Pago) => {
        if (!pago.comprobante_id) return;
        try {
            const { data } = await axios.get(`/api/comprobantes/${pago.comprobante_id}`);
            setPagosParaComprobante([pago]);
            setComprobanteInicial(data.comprobante);
            setComprobanteOpen(true);
        } catch {
            // fallback: abrir modal vacío
            setPagosParaComprobante([pago]);
            setComprobanteInicial(undefined);
            setComprobanteOpen(true);
        }
    };

    const handleEnviarComprobante = (comprobanteId: number) => {
        setComprobanteIdParaEnviar(comprobanteId);
        setEnviarModalOpen(true);
    };

    const handleCreatePago = async (data: any) => {
        try {
            setApiErrors({});
            await axios.post('/api/pagos', data);
            router.reload();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setApiErrors(error.response.data.errors);
            }
            throw error;
        }
    };

    const handleUpdatePago = async (data: any) => {
        if (!selectedPago) return;
        try {
            setApiErrors({});
            await axios.put(`/api/pagos/${selectedPago.pag_id}`, data);
            router.reload();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setApiErrors(error.response.data.errors);
            }
            throw error;
        }
    };

    const handleDelete = async (pago: Pago) => {
        if (!confirm('¿Estás seguro de eliminar este pago?')) return;
        try {
            await axios.delete(`/api/pagos/${pago.pag_id}`);
            router.reload();
        } catch (error) {
            console.error(error);
        }
    };

    const wrapAsPaginated = (data: Pago[]): Paginated<Pago> => ({
        data,
        current_page: 1,
        last_page: 1,
        per_page: data.length,
        total: data.length,
        from: 1,
        to: data.length,
    });

    const getColumns = (periodicidad?: string): Column<Pago>[] => {
        const baseColumns: Column<Pago>[] = [
            {
                label: '#',
                className: 'text-center w-10',
                render: (_, i) => <span className="text-gray-400 font-mono text-xs">{i + 1}</span>
            },
            {
                label: 'Concepto',
                className: 'text-left',
                render: (p) => (
                    <div className="flex flex-col text-left">
                        <span className="font-medium text-gray-900">{p.concepto_nombre || '—'}</span>
                        {p.observacion && <span className="text-[10px] text-gray-400 italic">{p.observacion}</span>}
                    </div>
                )
            }
        ];

        if (periodicidad === 'mensual') {
            baseColumns.push({
                label: 'Mes',
                render: (p) => p.pag_mes ? (
                    <Badge variant="outline" className="font-normal border-gray-200">
                        {p.pag_mes}
                    </Badge>
                ) : '—'
            });
        }

        baseColumns.push(
            {
                label: 'Año',
                render: (p) => <span className="font-semibold text-gray-600">{p.pag_anual}</span>
            },
            {
                label: 'Monto',
                className: 'text-right',
                render: (p) => (
                    <span className="font-bold text-blue-600">
                        S/ {p.pag_monto ? Number(p.pag_monto).toFixed(2) : '0.00'}
                    </span>
                )
            },
            {
                label: 'Estado',
                render: (p) => (
                    <Badge
                        className={`
                            ${p.estatus === 1 ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200'}
                            font-bold px-3 py-0.5
                        `}
                        variant="outline"
                    >
                        {p.estatus === 1 ? 'PAGADO' : 'PENDIENTE'}
                    </Badge>
                )
            },
            {
                label: 'Fecha',
                render: (p) => (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                        <Clock className="size-3" />
                        {p.pag_fecha || '—'}
                    </div>
                )
            }
        );

        return baseColumns;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Pagos - ${pagador.nombres}`} />

            <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <PageHeader
                        icon={Wallet}
                        title={`${pagador.nombres} ${pagador.apellidos}`}
                        subtitle={`DNI: ${pagador.numero_doc} • Teléfono: ${pagador.telefono_1} ${pagador.grado ? `• ${pagador.grado} ${pagador.seccion}` : ''}`}
                        iconColor="bg-blue-600"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            onClick={openCreateModal}
                            className="w-full sm:w-auto h-9 bg-[#00a65a] hover:bg-[#008d4c] text-white text-xs font-bold gap-2"
                        >
                            <Plus className="size-4" />
                            Agregar Pago
                        </Button>
                    </div>
                </div>

                {/* Tabs por Periodicidad */}
                <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-0">
                        <PageTabs
                            defaultValue="mensual"
                            tabs={[
                                {
                                    value: 'mensual',
                                    label: `Mensualidades (${pagosMensuales.length})`,
                                    icon: Calendar,
                                    content: (
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <ResourceTable
                                                rows={wrapAsPaginated(pagosMensuales)}
                                                columns={getColumns('mensual')}
                                                getKey={(p) => p.pag_id}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                extraActions={(pago: Pago) => (
                                                    <>
                                                        {pago.comprobante_id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => openComprobanteExistente(pago)}
                                                                    title="Ver comprobante"
                                                                    className="inline-flex items-center justify-center size-8 text-green-600 hover:text-green-700 transition-colors"
                                                                >
                                                                    <FileText className="size-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEnviarComprobante(pago.comprobante_id!)}
                                                                    title="Enviar comprobante"
                                                                    className="inline-flex items-center justify-center size-8 text-blue-600 hover:text-blue-700 transition-colors"
                                                                >
                                                                    <Send className="size-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => openComprobanteModal(pago)}
                                                                title="Emitir boleta / factura"
                                                                className="inline-flex items-center justify-center size-8 text-blue-600 hover:text-blue-700 transition-colors"
                                                            >
                                                                <FileText className="size-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            />
                                        </div>
                                    )
                                },
                                {
                                    value: 'unico',
                                    label: `Pago Único (${pagosUnicos.length})`,
                                    icon: CreditCard,
                                    content: (
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <ResourceTable
                                                rows={wrapAsPaginated(pagosUnicos)}
                                                columns={getColumns('unico')}
                                                getKey={(p) => p.pag_id}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                extraActions={(pago: Pago) => (
                                                    <>
                                                        {pago.comprobante_id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => openComprobanteExistente(pago)}
                                                                    title="Ver comprobante"
                                                                    className="inline-flex items-center justify-center size-8 text-green-600 hover:text-green-700 transition-colors"
                                                                >
                                                                    <FileText className="size-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEnviarComprobante(pago.comprobante_id!)}
                                                                    title="Enviar comprobante"
                                                                    className="inline-flex items-center justify-center size-8 text-blue-600 hover:text-blue-700 transition-colors"
                                                                >
                                                                    <Send className="size-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => openComprobanteModal(pago)}
                                                                title="Emitir boleta / factura"
                                                                className="inline-flex items-center justify-center size-8 text-blue-600 hover:text-blue-700 transition-colors"
                                                            >
                                                                <FileText className="size-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            />
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </CardContent>
                </Card>
            </div>

            {pagador.estudiante_id && (
                <PagoFormModal
                    open={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setSelectedPago(null);
                        setApiErrors({});
                    }}
                    contactoId={pagador.id_contacto}
                    estudianteId={pagador.estudiante_id}
                    editing={selectedPago}
                    onSave={selectedPago ? handleUpdatePago : handleCreatePago}
                    apiErrors={apiErrors}
                    clearErrors={() => setApiErrors({})}
                />
            )}

            <ComprobanteModal
                open={comprobanteOpen}
                onClose={() => { setComprobanteOpen(false); setComprobanteInicial(undefined); }}
                pagos={pagosParaComprobante}
                pagador={pagador}
                estudianteId={pagador.estudiante_id}
                initialResult={comprobanteInicial}
            />

            <EnviarComprobanteModal
                open={enviarModalOpen}
                onClose={() => setEnviarModalOpen(false)}
                comprobanteId={comprobanteIdParaEnviar}
                defaultPhone={pagador.telefono_1}
                defaultEmail=""
            />
        </AppLayout>
    );
}
