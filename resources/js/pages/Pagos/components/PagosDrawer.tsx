import { PlusCircle, Calendar, FileText, X, Receipt } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import ConfirmModal from '@/components/shared/ConfirmModal';
import api from '@/lib/api';
import type { Pagador, Pago, PagoFormData, PagoUpdateData } from '../hooks/usePago';
import { MESES } from '../hooks/usePago';
import PagoFormModal from './PagoFormModal';
import VoucherModal from './VoucherModal';
import AlertModal from '@/components/shared/AlertModal';

type Props = {
    open:     boolean;
    onClose:  () => void;
    pagador:  Pagador | null;
};

export default function PagosDrawer({ open, onClose, pagador }: Props) {
    const [pagos, setPagos]           = useState<Pago[]>([]);
    const [loading, setLoading]       = useState(false);
    const [modalOpen, setModalOpen]   = useState(false);
    const [editPago, setEditPago]     = useState<Pago | null>(null);
    const [apiErrors, setApiErrors]   = useState<Record<string, string[]>>({});
    const [fecIni, setFecIni]         = useState('');
    const [fecFin, setFecFin]         = useState('');
    const [filteredPagos, setFilteredPagos] = useState<Pago[]>([]);
    const [confirmGenerar, setConfirmGenerar] = useState(false);
    const [generando, setGenerando]   = useState(false);
    const [voucherPagId, setVoucherPagId] = useState<number | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ open: boolean; message: string; variant: 'error' | 'warning' | 'info' | 'success' }>({
        open: false,
        message: '',
        variant: 'info'
    });

    const cargar = useCallback(async () => {
        if (!pagador) {
return;
}

        setLoading(true);

        try {
            const { data } = await api.get(`/pagos/contactos/${pagador.id_contacto}`);
            const pagosList = data.data ?? data;
            setPagos(pagosList);
            setFilteredPagos(pagosList);
        } finally {
            setLoading(false);
        }
    }, [pagador]);

    useEffect(() => {
        if (open && pagador) {
cargar();
}
    }, [open, pagador, cargar]);

    const handleFilter = () => {
        if (!fecIni || !fecFin) {
            setFilteredPagos(pagos);

            return;
        }

        const filtered = pagos.filter((p) => {
            const dateStr = p.pag_fecha || `${p.pag_anual}-${(MESES.indexOf(p.pag_mes as any) + 1).toString().padStart(2, '0')}-01`;
            const fecha = new Date(dateStr);
            const inicio = new Date(fecIni);
            const fin = new Date(fecFin);

            return fecha >= inicio && fecha <= fin;
        });
        setFilteredPagos(filtered);
    };

    const handleClearFilter = () => {
        setFecIni('');
        setFecFin('');
        setFilteredPagos(pagos);
    };

    const handleGenerarMensualidad = async () => {
        if (!pagador) {
return;
}

        setGenerando(true);

        try {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            
            await api.post(`/pagos/generar-individual/${pagador.estu_id}`, {
                anio: currentYear.toString(),
                mes:  MESES[currentMonth],
            });
            await cargar();
            setConfirmGenerar(false);
        } catch (err: any) {
            console.error('Error al generar mensualidad:', err);
            setAlertConfig({
                open: true,
                message: err.response?.data?.message || 'Error al generar mensualidad',
                variant: err.response?.status === 422 ? 'warning' : 'error'
            });
        } finally {
            setGenerando(false);
        }
    };

    const handleCreate = async (data: PagoFormData) => {
        setApiErrors({});

        try {
            await api.post('/pagos/', data);
            await cargar();
        } catch (err: unknown) {
            const e = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };

            if (e.response?.status === 422 && e.response.data?.errors) {
                setApiErrors(e.response.data.errors);
            }

            throw err;
        }
    };

    const handleUpdate = async (data: PagoFormData) => {
        if (!editPago) {
            return;
        }

        setApiErrors({});

        try {
            const payload: PagoUpdateData = {
                pag_monto:    data.pag_monto,
                pag_nombre1:  data.pag_nombre1,
                pag_otro1:    data.pag_otro1,
                pag_nombre2:  data.pag_nombre2,
                pag_otro2:    data.pag_otro2,
                pag_notifica: data.pag_notifica,
                pag_fecha:    data.pag_fecha,
            };
            await api.put(`/pagos/${editPago.pag_id}`, payload);
            await cargar();
        } catch (err: unknown) {
            const e = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };

            if (e.response?.status === 422 && e.response.data?.errors) {
                setApiErrors(e.response.data.errors);
            }

            throw err;
        }
    };

    const handleDelete = async (pagoId: number) => {
        if (!confirm('¿Eliminar este pago?')) {
return;
}

        await api.delete(`/pagos/${pagoId}`);
        await cargar();
    };

    const openCreate = () => { setEditPago(null); setModalOpen(true); };
    const openEdit   = (p: Pago) => { setEditPago(p); setModalOpen(true); };

    if (!pagador) { return null; }

    const pagoColumns: Column<Pago>[] = [
        { label: '#',           render: (_, i) => i + 1 },
        { label: 'Año',         render: p => p.pag_anual },
        { label: 'Mes',         render: p => p.pag_mes },
        { label: 'Mensualidad', render: p => `S/ ${Number(p.pag_monto).toFixed(2)}` },
        {
            label: 'Adicional 1',
            render: p => (
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase leading-tight">{p.pag_nombre1 || 'Sin concepto'}</span>
                    <span className={Number(p.pag_otro1) > 0 ? '' : 'text-gray-300'}>
                        {Number(p.pag_otro1) > 0 ? `S/ ${Number(p.pag_otro1).toFixed(2)}` : '—'}
                    </span>
                </div>
            ),
        },
        {
            label: 'Adicional 2',
            render: p => (
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase leading-tight">{p.pag_nombre2 || 'Sin concepto'}</span>
                    <span className={Number(p.pag_otro2) > 0 ? '' : 'text-gray-300'}>
                        {Number(p.pag_otro2) > 0 ? `S/ ${Number(p.pag_otro2).toFixed(2)}` : '—'}
                    </span>
                </div>
            ),
        },
        {
            label: 'Total',
            render: p => <span className="font-semibold text-green-700">S/ {Number(p.total).toFixed(2)}</span>,
        },
        { label: 'Fecha Reg.', render: p => p.pag_fecha ?? '—' },
        {
            label: 'Estatus',
            render: p => (
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.estatus === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {p.estatus === 1 ? 'Pagado' : 'Pendiente'}
                </span>
            ),
        },
    ];

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
                <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col w-[95vw] p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="font-semibold text-base sm:text-lg">
                                    {pagador.nombres} {pagador.apellidos}
                                </span>
                                {pagador.mensualidad && (
                                    <span className="text-xs sm:text-sm font-normal text-gray-500">
                                        Mensualidad:
                                        <span className="ml-1 text-green-600 font-medium">
                                            S/ {pagador.mensualidad}
                                        </span>
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    size="sm"
                                    className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                                    onClick={() => setConfirmGenerar(true)}
                                >
                                    <Calendar className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Generar Mensualidad</span>
                                    <span className="sm:hidden">Generar Mensualidad</span>
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-[#00a65a] hover:bg-[#008d4c] text-white w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                                    onClick={openCreate}
                                >
                                    <PlusCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    Agregar Pago
                                </Button>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {/* Filtros por fecha */}
                    <div className="flex flex-col gap-3 pb-4 border-b">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs sm:text-sm">Fecha Inicio</Label>
                                <Input
                                    type="date"
                                    value={fecIni}
                                    onChange={(e) => setFecIni(e.target.value)}
                                    className="h-8 sm:h-9 text-xs sm:text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs sm:text-sm">Fecha Fin</Label>
                                <Input
                                    type="date"
                                    value={fecFin}
                                    onChange={(e) => setFecFin(e.target.value)}
                                    className="h-8 sm:h-9 text-xs sm:text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                size="sm"
                                onClick={handleFilter}
                                className="bg-blue-500 hover:bg-blue-600 text-white h-8 sm:h-9 text-xs sm:text-sm"
                            >
                                Buscar
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleClearFilter}
                                className="h-8 sm:h-9"
                                title="Limpiar filtros"
                            >
                                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600 text-white h-8 sm:h-9"
                                onClick={async () => {
                                    try {
                                        const res = await api.get('/pagos/reporte-pdf', {
                                            params: {
                                                contacto_id:   pagador.id_contacto,
                                                estudiante_id: pagador.estu_id,
                                                ...(fecIni && { fecha_inicio: fecIni }),
                                                ...(fecFin && { fecha_fin: fecFin }),
                                            },
                                            responseType: 'blob',
                                        });
                                        const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                                        const link = document.createElement('a');
                                        link.href     = url;
                                        link.download = `Reporte_Pagos_${pagador.estu_id}.pdf`;
                                        link.click();
                                        URL.revokeObjectURL(url);
                                    } catch {
                                        alert('Error al generar el PDF');
                                    }
                                }}
                                title="Generar PDF"
                            >
                                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto -mx-4 sm:mx-0">
                        {loading && (
                            <p className="py-6 text-center text-xs sm:text-sm text-gray-400">Cargando...</p>
                        )}

                        {!loading && filteredPagos.length === 0 && (
                            <p className="py-8 text-center text-xs sm:text-sm text-gray-400">
                                No hay pagos registrados aún.
                            </p>
                        )}

                        {!loading && filteredPagos.length > 0 && (
                            <ResourceTable
                                rows={{ data: filteredPagos, current_page: 1, last_page: 1, per_page: filteredPagos.length, total: filteredPagos.length, from: 1, to: filteredPagos.length }}
                                columns={pagoColumns}
                                getKey={p => p.pag_id}
                                loading={loading}
                                onEdit={openEdit}
                                onDelete={p => handleDelete(p.pag_id)}
                                extraActions={p => (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title="Ver comprobantes"
                                        className="size-7 text-amber-500 hover:bg-amber-50"
                                        onClick={() => setVoucherPagId(p.pag_id)}
                                    >
                                        <Receipt className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal crear */}
            {modalOpen && !editPago && (
                <PagoFormModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    contactoId={pagador.id_contacto}
                    estudianteId={pagador.estu_id}
                    mensualidad={pagador.mensualidad}
                    editing={null}
                    onSave={handleCreate}
                    apiErrors={apiErrors}
                    clearErrors={() => setApiErrors({})}
                />
            )}

            {/* Modal editar */}
            {modalOpen && editPago && (
                <PagoFormModal
                    open={modalOpen}
                    onClose={() => {
 setModalOpen(false); setEditPago(null); 
}}
                    contactoId={pagador.id_contacto}
                    estudianteId={pagador.estu_id}
                    mensualidad={pagador.mensualidad}
                    editing={editPago}
                    onSave={handleUpdate}
                    apiErrors={apiErrors}
                    clearErrors={() => setApiErrors({})}
                />
            )}

            {/* Modal de vouchers / comprobantes */}
            <VoucherModal
                open={voucherPagId !== null}
                onClose={() => setVoucherPagId(null)}
                pagId={voucherPagId}
            />

            {/* Modal de confirmación para generar mensualidad */}
            <ConfirmModal
                open={confirmGenerar}
                onClose={() => setConfirmGenerar(false)}
                onConfirm={handleGenerarMensualidad}
                title="Generar Mensualidad"
                message={`¿Está seguro que desea generar la mensualidad para el mes actual? El sistema calculará automáticamente el monto según la tarifa y los descuentos vigentes del alumno.`}
                processing={generando}
                confirmText="Sí, Generar"
                variant="default"
            />

            <AlertModal
                open={alertConfig.open}
                onClose={() => setAlertConfig(prev => ({ ...prev, open: false }))}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />
        </>
    );
}