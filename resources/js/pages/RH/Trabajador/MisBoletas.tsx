import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { FileText, Receipt, Search } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/shared/PageHeader';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import { useResource } from '@/hooks/useResource';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import AlertModal from '@/components/shared/AlertModal';
import axios from 'axios';
import type { BreadcrumbItem } from '@/types';

type Nomina = {
    nomina_id: number;
    periodo: string;
    mes: number;
    anio: number;
    sueldo_base: number;
    bonificaciones: number;
    total_descuentos: number;
    sueldo_neto: number;
    estado: 'pendiente' | 'aprobado' | 'pagado';
    estado_label: string;
    fecha_pago: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Mis Boletas', href: '/rh/mis-boletas' },
];

const estadoStyles: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
    aprobado:  'bg-green-100 text-green-700 border-green-200',
    pagado:    'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function MisBoletasPage() {
    const [mes, setMes]       = useState<string>('todos');
    const [anio, setAnio]     = useState<string>(new Date().getFullYear().toString());
    const [estado, setEstado] = useState<string>('todos');
    const [alertModal, setAlertModal] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'error' });

    const res = useResource<Nomina>('/rh/trabajador/mis-boletas', {
        mes:    mes === 'todos' ? null : mes,
        anio,
        estado: estado === 'todos' ? null : estado,
    });

    const handleDescargarBoleta = async (nominaId: number) => {
        try {
            const response = await axios.get(`/api/rh/trabajador/mis-boletas/${nominaId}/boleta`, {
                responseType: 'blob',
            });
            const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch {
            setAlertModal({ open: true, message: 'Error al generar la boleta de pago', variant: 'error' });
        }
    };

    const columns: Column<Nomina>[] = [
        { label: '#',            render: (_, i) => i + 1 },
        { label: 'Período',      render: r => <span className="font-semibold">{r.periodo}</span> },
        { label: 'Sueldo Base',  render: r => formatCurrency(r.sueldo_base) },
        { label: 'Bonif.',       render: r => formatCurrency(r.bonificaciones) },
        {
            label: 'Desc.',
            render: r => <span className="text-red-600">-{formatCurrency(r.total_descuentos)}</span>,
        },
        {
            label: 'Neto',
            render: r => <span className="font-bold text-green-700">{formatCurrency(r.sueldo_neto)}</span>,
        },
        {
            label: 'Estado',
            render: r => (
                <Badge variant="outline" className={estadoStyles[r.estado] ?? ''}>
                    {r.estado_label}
                </Badge>
            ),
        },
        { label: 'F. Pago', render: r => r.fecha_pago ?? <span className="text-gray-400 italic text-xs">—</span> },
        {
            label: 'Boleta',
            render: r => r.estado !== 'pendiente' ? (
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-7"
                    onClick={() => handleDescargarBoleta(r.nomina_id)}
                >
                    <FileText className="h-3.5 w-3.5 text-red-500" /> PDF
                </Button>
            ) : (
                <span className="text-gray-400 italic text-xs">No disponible</span>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mis Boletas de Pago" />

            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    icon={Receipt}
                    title="Mis Boletas de Pago"
                    subtitle="Historial de nóminas y descarga de boletas"
                    iconColor="bg-emerald-600"
                />

                <Card>
                    <CardContent className="p-4 flex flex-wrap gap-4 items-end">
                        <div className="space-y-1.5 flex-1 min-w-[140px]">
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
                        <div className="space-y-1.5 flex-1 min-w-[120px]">
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
                        <div className="space-y-1.5 flex-1 min-w-[140px]">
                            <Label>Estado</Label>
                            <Select value={estado} onValueChange={setEstado}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
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
                        getKey={r => r.nomina_id}
                        onPageChange={res.setPage}
                    />
                )}
            </div>

            <AlertModal
                open={alertModal.open}
                onClose={() => setAlertModal(a => ({ ...a, open: false }))}
                message={alertModal.message}
                variant={alertModal.variant}
            />
        </AppLayout>
    );
}
