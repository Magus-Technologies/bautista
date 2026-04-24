import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import ResourcePage from '@/components/shared/ResourcePage';
import { BarChart3, Download, FileText, Search, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function ReportesRHPage() {
    const [personal, setPersonal] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [mes, setMes] = useState<string>(new Date().getMonth() + 1 + '');
    const [anio, setAnio] = useState<string>(new Date().getFullYear() + '');
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const breadcrumbs = [
        { title: 'Inicio', href: '/dashboard' },
        { title: 'Recursos Humanos', href: '#' },
        { title: 'Reportes', href: '/rh/reportes' },
    ];

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

    const handleGenerate = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const response = await axios.get('/api/rh/asistencia/reporte-periodo', {
                params: {
                    user_id: selectedUser,
                    mes: mes,
                    anio: anio
                }
            });
            setReportData(response.data);
        } catch (error) {
            console.error('Error al generar reporte:', error);
            alert('Error al generar el reporte');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="Reportes - RH" />
            <ResourcePage
                breadcrumbs={breadcrumbs}
                pageTitle="Reportes de RH"
                subtitle="Estadísticas y reportes de asistencia y nómina"
                icon={BarChart3}
                iconColor="bg-amber-600"
                hideSearch={true}
                hideButton={true}
            >
                <div className="grid gap-6 md:grid-cols-4">
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg">Filtros</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Personal</Label>
                                <Select value={selectedUser} onValueChange={setSelectedUser}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {personal.map(u => (
                                            <SelectItem key={u.id} value={u.id.toString()}>
                                                {u.nombre_completo}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Mes</Label>
                                <Select value={mes} onValueChange={setMes}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
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
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026].map(y => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button 
                                className="w-full gap-2" 
                                onClick={handleGenerate}
                                disabled={loading || !selectedUser}
                            >
                                <Search className="size-4" />
                                {loading ? 'Generando...' : 'Generar Reporte'}
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="md:col-span-3 space-y-6">
                        {!reportData && !loading && (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                                <FileText className="size-12 mb-4 opacity-20" />
                                <p>Selecciona un trabajador y período para ver el reporte</p>
                            </div>
                        )}

                        {reportData && (
                            <>
                                <div className="grid gap-4 md:grid-cols-4">
                                    <StatCard title="Días Presentes" value={reportData.estadisticas.dias_presentes} color="text-green-600" />
                                    <StatCard title="Tardanzas" value={reportData.estadisticas.total_tardanzas} color="text-amber-600" />
                                    <StatCard title="Días Ausentes" value={reportData.estadisticas.dias_ausentes} color="text-red-600" />
                                    <StatCard title="Total Descuentos" value={formatCurrency(reportData.estadisticas.total_descuentos)} color="text-blue-600" />
                                </div>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Detalle de Asistencias</CardTitle>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Download className="size-4" /> Exportar
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="rounded-md border">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50">
                                                    <tr>
                                                        <th className="p-2 text-left">Fecha</th>
                                                        <th className="p-2 text-center">Entrada</th>
                                                        <th className="p-2 text-center">Salida</th>
                                                        <th className="p-2 text-center">Estado</th>
                                                        <th className="p-2 text-right">Desc.</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.data.map((item: any) => (
                                                        <tr key={item.asistencia_personal_id} className="border-t hover:bg-muted/30">
                                                            <td className="p-2 font-medium">{item.fecha}</td>
                                                            <td className="p-2 text-center">{item.hora_entrada?.substring(0, 5) || '—'}</td>
                                                            <td className="p-2 text-center">{item.hora_salida?.substring(0, 5) || '—'}</td>
                                                            <td className="p-2 text-center">
                                                                <Badge variant={item.estado === 'presente' ? 'outline' : 'secondary'}>
                                                                    {item.estado_label}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-2 text-right text-red-600">
                                                                {item.descuento_aplicado > 0 ? formatCurrency(item.descuento_aplicado) : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {reportData.data.length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                                No hay registros para este período
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </div>
            </ResourcePage>
        </>
    );
}

function StatCard({ title, value, color }: { title: string, value: any, color: string }) {
    return (
        <Card>
            <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
        </Card>
    );
}
