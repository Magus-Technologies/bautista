import { Head } from '@inertiajs/react';
import { DollarSign, FileText, CheckCircle2, CreditCard, Trash2, Search } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import { Button } from '@/components/ui/button';
import { useResource } from '@/hooks/useResource';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import GenerateNominaModal from './components/GenerateNominaModal';
import axios from 'axios';
import ConfirmModal from '@/components/shared/ConfirmModal';
import AlertModal from '@/components/shared/AlertModal';

type Nomina = {
    nomina_id: number;
    user_id: number;
    user: { nombre_completo: string };
    mes: number;
    anio: number;
    periodo: string;
    sueldo_base: number;
    bonificaciones: number;
    descuentos_tardanzas: number;
    total_descuentos: number;
    dias_trabajados: number;
    dias_ausentes: number;
    total_tardanzas: number;
    sueldo_neto: number;
    estado: 'pendiente' | 'aprobado' | 'pagado';
    estado_label: string;
    fecha_pago: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'RH', href: '#' },
    { title: 'Nómina', href: '/rh/nomina' },
];

export default function NominaPage() {
    const [mes, setMes] = useState<string>((new Date().getMonth() + 1).toString());
    const [anio, setAnio] = useState<string>(new Date().getFullYear().toString());
    const [estado, setEstado] = useState<string>('todos');
    
    const res = useResource<Nomina>('/rh/nomina', {
        mes: mes === 'todos' ? null : mes,
        anio,
        estado: estado === 'todos' ? null : estado,
    });

    const [genModalOpen, setGenModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ id: number, type: 'aprobar' | 'pagar' | 'eliminar' } | null>(null);
    const [alertModal, setAlertModal] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'success' });

    const showAlert = (message: string, variant: 'success' | 'error') => setAlertModal({ open: true, message, variant });

    const handleVerBoleta = async (nominaId: number) => {
        try {
            const response = await axios.get(`/api/rh/nomina/${nominaId}/boleta`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch {
            showAlert('Error al generar la boleta', 'error');
        }
    };

    const handleAction = async () => {
        if (!confirmAction) return;
        try {
            if (confirmAction.type === 'aprobar') {
                await axios.post(`/api/rh/nomina/${confirmAction.id}/aprobar`);
                showAlert('Nómina aprobada exitosamente', 'success');
            } else if (confirmAction.type === 'pagar') {
                await axios.post(`/api/rh/nomina/${confirmAction.id}/pagar`, {
                    fecha_pago: new Date().toISOString().split('T')[0]
                });
                showAlert('Pago registrado exitosamente', 'success');
            } else if (confirmAction.type === 'eliminar') {
                await res.remove(confirmAction.id);
                showAlert('Nómina eliminada exitosamente', 'success');
            }
            res.reload();
        } catch (error: any) {
            showAlert(error.response?.data?.message || 'Error al procesar la acción', 'error');
        } finally {
            setConfirmAction(null);
        }
    };

    const columns: Column<Nomina>[] = [
        { label: '#', render: (_n, i) => i + 1 },
        { label: 'Trabajador', render: (n) => n.user?.nombre_completo || '—' },
        { label: 'Periodo', render: (n) => n.periodo },
        { label: 'Sueldo Base', render: (n) => formatCurrency(n.sueldo_base) },
        { label: 'Bonif.', render: (n) => formatCurrency(n.bonificaciones) },
        { label: 'Desc.', render: (n) => <span className="text-red-600">-{formatCurrency(n.total_descuentos)}</span> },
        { label: 'Sueldo Neto', render: (n) => <span className="font-bold text-green-700">{formatCurrency(n.sueldo_neto)}</span> },
        { 
            label: 'Estado', 
            render: (n) => {
                const styles: Record<string, string> = {
                    pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
                    aprobado:  'bg-green-100 text-green-700 border-green-200',
                    pagado:    'bg-emerald-100 text-emerald-700 border-emerald-200',
                };
                return <Badge variant="outline" className={styles[n.estado] ?? ''}>{n.estado_label}</Badge>;
            }
        },
        { 
            label: 'Acciones', 
            render: (n) => (
                <div className="flex gap-1">
                    {n.estado === 'pendiente' && (
                        <Button size="icon" variant="ghost" onClick={() => setConfirmAction({ id: n.nomina_id, type: 'aprobar' })} title="Aprobar">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        </Button>
                    )}
                    {n.estado === 'aprobado' && (
                        <Button size="icon" variant="ghost" onClick={() => setConfirmAction({ id: n.nomina_id, type: 'pagar' })} title="Pagar">
                            <CreditCard className="h-4 w-4 text-green-600" />
                        </Button>
                    )}
                    <Button size="icon" variant="ghost" title="Ver Boleta" onClick={() => handleVerBoleta(n.nomina_id)}>
                        <FileText className="h-4 w-4 text-gray-600" />
                    </Button>
                    {n.estado !== 'pagado' && (
                        <Button size="icon" variant="ghost" onClick={() => setConfirmAction({ id: n.nomina_id, type: 'eliminar' })} title="Eliminar">
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                    )}
                </div>
            )
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nómina - RH" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <PageHeader
                        icon={DollarSign}
                        title="Gestión de Nómina"
                        subtitle="Cálculo y gestión de pagos al personal"
                        iconColor="bg-green-600"
                    />
                    <Button onClick={() => setGenModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                        + Generar Nóminas
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-4 flex flex-wrap gap-4 items-end">
                        <div className="space-y-1.5 flex-1 min-w-[150px]">
                            <Label>Mes</Label>
                            <Select value={mes} onValueChange={setMes}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los meses</SelectItem>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                                            {new Date(0, i).toLocaleString('es-PE', { month: 'long' }).toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-[150px]">
                            <Label>Año</Label>
                            <Select value={anio} onValueChange={setAnio}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[2024, 2025, 2026].map(y => (
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-[150px]">
                            <Label>Estado</Label>
                            <Select value={estado} onValueChange={setEstado}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los estados</SelectItem>
                                    <SelectItem value="pendiente">Pendiente</SelectItem>
                                    <SelectItem value="aprobado">Aprobado</SelectItem>
                                    <SelectItem value="pagado">Pagado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={() => res.reload()} variant="outline" className="gap-2">
                            <Search className="h-4 w-4" /> Buscar
                        </Button>
                    </CardContent>
                </Card>

                {res.rows && (
                    <ResourceTable
                        rows={res.rows}
                        columns={columns}
                        getKey={(n) => n.nomina_id}
                        onPageChange={res.setPage}
                    />
                )}
            </div>

            <GenerateNominaModal
                open={genModalOpen}
                onClose={() => setGenModalOpen(false)}
                onSuccess={() => { setGenModalOpen(false); res.reload(); }}
            />


            <ConfirmModal
                open={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleAction}
                title={confirmAction?.type === 'eliminar' ? 'Eliminar Nómina' : 'Confirmar Acción'}
                message={`¿Estás seguro de que deseas ${confirmAction?.type} esta nómina?`}
                variant={confirmAction?.type === 'eliminar' ? 'danger' : 'default'}
            />

            <AlertModal
                open={alertModal.open}
                onClose={() => setAlertModal(a => ({ ...a, open: false }))}
                message={alertModal.message}
                variant={alertModal.variant}
            />
        </AppLayout>
    );
}
