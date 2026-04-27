import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
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
import type { BreadcrumbItem } from '@/types';

type Asistencia = {
    asistencia_personal_id: number;
    fecha: string;
    hora_entrada: string | null;
    hora_salida: string | null;
    estado: string;
    estado_label: string;
    minutos_tardanza: number;
    minutos_salida_anticipada: number;
    descuento_aplicado: number;
    tipo_registro: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Mi Asistencia', href: '/rh/mi-asistencia' },
];

const estadoStyles: Record<string, string> = {
    presente: 'bg-green-100 text-green-700 border-green-200',
    ausente:  'bg-red-100 text-red-700 border-red-200',
    tardanza: 'bg-amber-100 text-amber-700 border-amber-200',
    licencia: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function MiAsistenciaPage() {
    const [mes, setMes]       = useState<string>((new Date().getMonth() + 1).toString());
    const [anio, setAnio]     = useState<string>(new Date().getFullYear().toString());
    const [estado, setEstado] = useState<string>('todos');

    const res = useResource<Asistencia>('/rh/trabajador/mi-asistencia', {
        mes,
        anio,
        estado: estado === 'todos' ? null : estado,
    });

    const columns: Column<Asistencia>[] = [
        { label: '#',           render: (_, i) => i + 1 },
        { label: 'Fecha',       render: r => r.fecha },
        {
            label: 'Entrada',
            render: r => r.hora_entrada
                ? <span className="font-medium">{r.hora_entrada.substring(0, 5)}</span>
                : <span className="text-gray-400 italic text-xs">Sin registrar</span>,
        },
        {
            label: 'Salida',
            render: r => r.hora_salida
                ? <span className="font-medium">{r.hora_salida.substring(0, 5)}</span>
                : <span className="text-gray-400 italic text-xs">Sin registrar</span>,
        },
        {
            label: 'Estado',
            render: r => (
                <Badge variant="outline" className={estadoStyles[r.estado] ?? 'bg-gray-100 text-gray-600'}>
                    {r.estado_label}
                </Badge>
            ),
        },
        {
            label: 'Tardanza',
            render: r => r.minutos_tardanza > 0
                ? <span className="text-orange-600 font-medium">{r.minutos_tardanza} min</span>
                : <span className="text-gray-400">—</span>,
        },
        {
            label: 'Descuento',
            render: r => r.descuento_aplicado > 0
                ? <span className="text-red-600 font-medium">S/ {r.descuento_aplicado.toFixed(2)}</span>
                : <span className="text-gray-400">—</span>,
        },
        {
            label: 'Tipo',
            render: r => (
                <Badge variant="outline" className={r.tipo_registro === 'auto' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                    {r.tipo_registro === 'auto' ? 'AUTO' : 'MANUAL'}
                </Badge>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mi Asistencia" />

            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    icon={CalendarDays}
                    title="Mi Asistencia"
                    subtitle="Historial personal de entradas, salidas y descuentos"
                    iconColor="bg-blue-600"
                />

                <Card>
                    <CardContent className="p-4 flex flex-wrap gap-4 items-end">
                        <div className="space-y-1.5 flex-1 min-w-[140px]">
                            <Label>Mes</Label>
                            <Select value={mes} onValueChange={setMes}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
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
                                    <SelectItem value="presente">Presente</SelectItem>
                                    <SelectItem value="ausente">Ausente</SelectItem>
                                    <SelectItem value="tardanza">Tardanza</SelectItem>
                                    <SelectItem value="licencia">Licencia</SelectItem>
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
                        getKey={r => r.asistencia_personal_id}
                        onPageChange={res.setPage}
                    />
                )}
            </div>
        </AppLayout>
    );
}
