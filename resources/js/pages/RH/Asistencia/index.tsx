import { Head } from '@inertiajs/react';
import { Clock, Download, Search, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AsistenciaManualModal } from './components/AsistenciaManualModal';
import axios from 'axios';

type Asistencia = {
    asistencia_personal_id: number;
    user_id: number;
    horario_id: number | null;
    fecha: string;
    hora_entrada: string | null;
    hora_salida: string | null;
    estado: 'presente' | 'ausente' | 'tardanza' | 'permiso' | 'vacaciones' | 'licencia';
    estado_label: string;
    minutos_tardanza: number;
    minutos_salida_anticipada: number;
    descuento_aplicado: number;
    observaciones: string | null;
    tipo_registro: 'automatico' | 'manual';
    horario: {
        horario_id: number;
        turno: 'M' | 'T' | 'N';
        hora_ingreso: string;
        hora_salida: string;
        minutos_tolerancia: number;
    } | null;
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

export default function AsistenciaRHPage() {
    const [filters, setFilters] = useState({
        user_id: '',
        fecha_desde: format(new Date(), 'yyyy-MM-01'),
        fecha_hasta: format(new Date(), 'yyyy-MM-dd'),
        estado: 'todos'
    });
    
    const res = useResource<Asistencia>('/rh/asistencia', {
        ...filters,
        estado: filters.estado === 'todos' ? null : filters.estado,
    });

    const [personal, setPersonal] = useState<any[]>([]);
    const [manualModalOpen, setManualModalOpen] = useState(false);

    useEffect(() => {
        loadPersonal();
    }, []);

    const loadPersonal = async () => {
        try {
            const response = await axios.get('/api/rh/contratos/activos');
            setPersonal(response.data.data.map((c: any) => c.user));
        } catch (error) {
            console.error('Error al cargar personal:', error);
        }
    };

    const columns: Column<Asistencia>[] = [
        { label: '#', render: (_a, i) => ((res.rows?.current_page || 1) - 1) * (res.rows?.per_page || 15) + (i || 0) + 1 },
        { label: 'Trabajador', render: (a) => a.user?.nombre_completo || '—' },
        { label: 'Fecha', render: (a) => format(new Date(a.fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }) },
        { label: 'Entrada', render: (a) => a.hora_entrada?.substring(0, 5) || '—' },
        {
            label: 'Salida',
            render: (a) => a.hora_salida
                ? a.hora_salida.substring(0, 5)
                : <span className="text-xs text-slate-400 italic">Sin registrar</span>
        },
        { 
            label: 'Estado', 
            render: (a) => {
                const variants: any = { 
                    presente: 'success', 
                    ausente: 'destructive', 
                    tardanza: 'warning',
                    permiso: 'default',
                    vacaciones: 'secondary',
                    licencia: 'secondary'
                };
                return <Badge variant={variants[a.estado] || 'outline'}>{a.estado.toUpperCase()}</Badge>;
            }
        },
        {
            label: 'Turno',
            render: (a) => {
                const label: Record<string, string> = { M: 'Mañana', T: 'Tarde', N: 'Noche' };
                return a.horario ? (
                    <Badge variant="outline">{label[a.horario.turno] ?? a.horario.turno}</Badge>
                ) : '—';
            }
        },
        {
            label: 'Tardanza',
            render: (a) => a.minutos_tardanza > 0 ? (
                <span className="text-orange-600 font-medium">{a.minutos_tardanza} min</span>
            ) : '—'
        },
        {
            label: 'Salida Antic.',
            render: (a) => a.minutos_salida_anticipada > 0 ? (
                <span className="text-orange-500 font-medium">{a.minutos_salida_anticipada} min</span>
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
            render: (a) => a.tipo_registro === 'manual'
                ? <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">MANUAL</Badge>
                : <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">AUTO</Badge>
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
                        <Button onClick={() => setManualModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="h-4 w-4" />
                            Registro Manual
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" />
                            Exportar
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-4 flex flex-wrap gap-4 items-end">
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <Label>Trabajador</Label>
                            <Select value={filters.user_id} onValueChange={(v) => setFilters({ ...filters, user_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Todos los trabajadores" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los trabajadores</SelectItem>
                                    {personal.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.nombre_completo}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 w-40">
                            <Label>Desde</Label>
                            <Input type="date" value={filters.fecha_desde} onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })} />
                        </div>
                        <div className="space-y-1.5 w-40">
                            <Label>Hasta</Label>
                            <Input type="date" value={filters.fecha_hasta} onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })} />
                        </div>
                        <div className="space-y-1.5 w-40">
                            <Label>Estado</Label>
                            <Select value={filters.estado} onValueChange={(v) => setFilters({ ...filters, estado: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="presente">Presente</SelectItem>
                                    <SelectItem value="tardanza">Tardanza</SelectItem>
                                    <SelectItem value="ausente">Ausente</SelectItem>
                                    <SelectItem value="permiso">Permiso</SelectItem>
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
                        getKey={(a) => a.asistencia_personal_id}
                        onPageChange={res.setPage}
                    />
                )}
            </div>

            <AsistenciaManualModal 
                open={manualModalOpen} 
                onClose={() => setManualModalOpen(false)} 
                onSuccess={() => { setManualModalOpen(false); res.reload(); }} 
            />
        </AppLayout>
    );
}
