import { Head } from '@inertiajs/react';
import { Clock, Download } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import { Button } from '@/components/ui/button';
import { useResource } from '@/hooks/useResource';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Asistencia = {
    asistencia_personal_id: number;
    user_id: number;
    fecha: string;
    hora_entrada: string | null;
    hora_salida: string | null;
    estado: 'presente' | 'ausente' | 'tardanza' | 'permiso' | 'vacaciones' | 'licencia';
    minutos_tardanza: number;
    descuento_aplicado: number;
    observaciones: string | null;
    tipo_registro: 'automatico' | 'manual';
    user: {
        id: number;
        nombre_completo: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'RH', href: '#' },
    { title: 'Asistencia', href: '/rh/asistencia' },
];

const estadoBadge = (estado: string) => {
    const variants: Record<string, { variant: 'default' | 'success' | 'warning' | 'destructive'; label: string }> = {
        presente: { variant: 'success', label: 'Presente' },
        ausente: { variant: 'destructive', label: 'Ausente' },
        tardanza: { variant: 'warning', label: 'Tardanza' },
        permiso: { variant: 'default', label: 'Permiso' },
        vacaciones: { variant: 'default', label: 'Vacaciones' },
        licencia: { variant: 'default', label: 'Licencia' },
    };
    const config = variants[estado] || { variant: 'default', label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function AsistenciaRHPage() {
    const res = useResource<Asistencia>('/rh/asistencia');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const columns: Column<Asistencia>[] = [
        { label: '#', render: (_a, i) => ((res.rows?.current_page || 1) - 1) * (res.rows?.per_page || 15) + (i || 0) + 1 },
        { label: 'Trabajador', render: (a) => a.user?.nombre_completo || '—' },
        { label: 'Fecha', render: (a) => format(new Date(a.fecha), 'dd/MM/yyyy', { locale: es }) },
        { label: 'Entrada', render: (a) => a.hora_entrada?.substring(0, 5) || '—' },
        { label: 'Salida', render: (a) => a.hora_salida?.substring(0, 5) || '—' },
        { label: 'Estado', render: (a) => estadoBadge(a.estado) },
        { 
            label: 'Tardanza', 
            render: (a) => a.minutos_tardanza > 0 ? (
                <span className="text-orange-600 font-medium">{a.minutos_tardanza} min</span>
            ) : '—'
        },
        { 
            label: 'Descuento', 
            render: (a) => a.descuento_aplicado > 0 ? (
                <span className="text-red-600 font-medium">S/ {a.descuento_aplicado.toFixed(2)}</span>
            ) : '—'
        },
        { 
            label: 'Tipo', 
            render: (a) => (
                <Badge variant={a.tipo_registro === 'automatico' ? 'default' : 'secondary'}>
                    {a.tipo_registro === 'automatico' ? 'Auto' : 'Manual'}
                </Badge>
            )
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asistencia Personal - RH" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <PageHeader
                        icon={Clock}
                        title="Asistencia de Personal"
                        subtitle="Registro y control de asistencia del personal"
                        iconColor="bg-blue-600"
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" />
                            Exportar
                        </Button>
                    </div>
                </div>

                {res.rows && (
                    <ResourceTable
                        rows={res.rows}
                        columns={columns}
                        getKey={(a) => a.asistencia_personal_id}
                        onPageChange={res.setPage}
                    />
                )}
                {res.loading && (
                    <div className="py-8 text-center text-sm text-gray-400 animate-pulse">Cargando...</div>
                )}
            </div>
        </AppLayout>
    );
}
