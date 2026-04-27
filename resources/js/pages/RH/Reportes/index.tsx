import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import ResourcePage from '@/components/shared/ResourcePage';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import { BarChart3, FileText, Search, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { formatCurrency } from '@/lib/utils';
import AlertModal from '@/components/shared/AlertModal';

type AsistenciaRow = {
    asistencia_personal_id: number;
    fecha: string;
    hora_entrada: string | null;
    hora_salida: string | null;
    estado: string;
    estado_label: string;
    minutos_tardanza: number;
    minutos_salida_anticipada: number;
    descuento_aplicado: number;
};

type Estadisticas = {
    dias_presentes: number;
    dias_ausentes: number;
    total_tardanzas: number;
    minutos_tardanza_total: number;
    minutos_salida_anticipada: number;
    total_descuentos: number;
};

export default function ReportesRHPage() {
    const [personal, setPersonal]           = useState<any[]>([]);
    const [selectedUser, setSelectedUser]   = useState<string>('');
    const [mes, setMes]                     = useState<string>(new Date().getMonth() + 1 + '');
    const [anio, setAnio]                   = useState<string>(new Date().getFullYear() + '');
    const [rows, setRows]                   = useState<AsistenciaRow[]>([]);
    const [estadisticas, setEstadisticas]   = useState<Estadisticas | null>(null);
    const [loading, setLoading]             = useState(false);
    const [exporting, setExporting]         = useState<'pdf' | 'excel' | null>(null);
    const [alertModal, setAlertModal]       = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'error' });

    const breadcrumbs = [
        { title: 'Inicio', href: '/dashboard' },
        { title: 'Recursos Humanos', href: '#' },
        { title: 'Reportes', href: '/rh/reportes' },
    ];

    useEffect(() => {
        axios.get('/api/rh/contratos/activos').then(r => {
            setPersonal(r.data.data.map((c: any) => c.user));
        });
    }, []);

    const handleGenerate = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const { data } = await axios.get('/api/rh/asistencia/reporte-periodo', {
                params: { user_id: selectedUser, mes, anio },
            });
            setRows(data.data);
            setEstadisticas(data.estadisticas);
        } catch {
            setAlertModal({ open: true, message: 'Error al generar el reporte', variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (tipo: 'pdf' | 'excel') => {
        if (!selectedUser) return;
        setExporting(tipo);
        try {
            const endpoint = tipo === 'pdf' ? '/api/rh/asistencia/exportar-pdf' : '/api/rh/asistencia/exportar-excel';
            const mimeType = tipo === 'pdf'
                ? 'application/pdf'
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

            const response = await axios.get(endpoint, {
                params: { user_id: selectedUser, mes, anio },
                responseType: 'blob',
            });

            const url = URL.createObjectURL(new Blob([response.data], { type: mimeType }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte_asistencia_${mes}_${anio}.${tipo === 'pdf' ? 'pdf' : 'xlsx'}`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            setAlertModal({ open: true, message: `Error al exportar el reporte en ${tipo.toUpperCase()}`, variant: 'error' });
        } finally {
            setExporting(null);
        }
    };

    const estadoBadge = (estado: string, label: string) => {
        const styles: Record<string, string> = {
            presente: 'bg-green-100 text-green-700 border-green-200',
            ausente:  'bg-red-100 text-red-700 border-red-200',
            tardanza: 'bg-amber-100 text-amber-700 border-amber-200',
            licencia: 'bg-blue-100 text-blue-700 border-blue-200',
        };
        return <Badge variant="outline" className={styles[estado] ?? 'bg-gray-100 text-gray-600'}>{label}</Badge>;
    };

    const paginated = {
        data: rows,
        current_page: 1,
        last_page: 1,
        per_page: rows.length || 1,
        total: rows.length,
        from: rows.length ? 1 : 0,
        to: rows.length,
    };

    const columns: Column<AsistenciaRow>[] = [
        { label: '#',           render: (_, i) => i + 1 },
        { label: 'Fecha',       render: r => r.fecha },
        { label: 'Entrada',     render: r => r.hora_entrada?.substring(0, 5) ?? <span className="text-gray-400 italic text-xs">—</span> },
        { label: 'Salida',      render: r => r.hora_salida?.substring(0, 5)  ?? <span className="text-gray-400 italic text-xs">—</span> },
        { label: 'Estado',      render: r => estadoBadge(r.estado, r.estado_label) },
        { label: 'Tardanza',    render: r => r.minutos_tardanza > 0 ? <span className="text-orange-600">{r.minutos_tardanza} min</span> : '—' },
        { label: 'Sal. Antic.', render: r => r.minutos_salida_anticipada > 0 ? <span className="text-orange-500">{r.minutos_salida_anticipada} min</span> : '—' },
        { label: 'Descuento',   render: r => r.descuento_aplicado > 0 ? <span className="text-red-600 font-medium">{formatCurrency(r.descuento_aplicado)}</span> : '—' },
    ];

    const hayReporte = estadisticas !== null;
    const hayFiltros = !!selectedUser;

    return (
        <>
            <Head title="Reportes - RH" />
            <ResourcePage
                breadcrumbs={breadcrumbs}
                pageTitle="Reportes de RH"
                subtitle="Estadísticas y reportes de asistencia del personal"
                icon={BarChart3}
                iconColor="bg-amber-600"
                hideSearch={true}
                hideButton={true}
            >
                <div className="grid gap-6 md:grid-cols-4">
                    {/* Panel de filtros */}
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle className="text-base">Filtros</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Personal</Label>
                                <Select value={selectedUser} onValueChange={setSelectedUser}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>
                                        {personal.map(u => (
                                            <SelectItem key={u.id} value={u.id.toString()}>{u.nombre_completo}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
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

                            <div className="space-y-2">
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

                            <Button className="w-full gap-2" onClick={handleGenerate} disabled={loading || !selectedUser}>
                                <Search className="size-4" />
                                {loading ? 'Generando...' : 'Generar Reporte'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Contenido del reporte */}
                    <div className="md:col-span-3 space-y-6">
                        {!hayReporte && !loading && (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                                <FileText className="size-12 mb-4 opacity-20" />
                                <p>Selecciona un trabajador y período para ver el reporte</p>
                            </div>
                        )}

                        {hayReporte && estadisticas && (
                            <>
                                <div className="grid gap-4 md:grid-cols-5">
                                    <StatCard title="Días Presentes"   value={estadisticas.dias_presentes}                          color="text-green-600" />
                                    <StatCard title="Tardanzas"        value={estadisticas.total_tardanzas}                         color="text-amber-600" />
                                    <StatCard title="Min. Tardanza"    value={`${estadisticas.minutos_tardanza_total ?? 0} min`}     color="text-orange-500" />
                                    <StatCard title="Min. Sal. Antic." value={`${estadisticas.minutos_salida_anticipada ?? 0} min`}  color="text-orange-600" />
                                    <StatCard title="Total Descuentos" value={formatCurrency(estadisticas.total_descuentos)}         color="text-red-600" />
                                </div>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                                        <CardTitle className="text-base">Detalle de Asistencias</CardTitle>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleExport('pdf')}
                                                disabled={!hayFiltros || !!exporting}
                                            >
                                                <FileText className="size-4" />
                                                {exporting === 'pdf' ? 'Exportando...' : 'PDF'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
                                                onClick={() => handleExport('excel')}
                                                disabled={!hayFiltros || !!exporting}
                                            >
                                                <FileSpreadsheet className="size-4" />
                                                {exporting === 'excel' ? 'Exportando...' : 'Excel'}
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <ResourceTable
                                            rows={paginated}
                                            columns={columns}
                                            getKey={r => r.asistencia_personal_id}
                                        />
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </div>
            </ResourcePage>

            <AlertModal
                open={alertModal.open}
                onClose={() => setAlertModal(a => ({ ...a, open: false }))}
                message={alertModal.message}
                variant={alertModal.variant}
            />
        </>
    );
}

function StatCard({ title, value, color }: { title: string; value: any; color: string }) {
    return (
        <Card>
            <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
        </Card>
    );
}
