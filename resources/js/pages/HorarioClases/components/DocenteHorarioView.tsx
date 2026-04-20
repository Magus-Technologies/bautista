import { BarChart3, Clock, Download, Loader2, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/shared/StatCard';
import api from '@/lib/api';
import HorarioSemanal from './HorarioSemanal';

type Props = {
    docenteId: number;
};

type CargaHoraria = {
    total_clases: number;
    total_horas_semana: number;
    total_minutos_semana: number;
    promedio_horas_dia: number;
};

export default function DocenteHorarioView({ docenteId }: Props) {
    const [horario, setHorario]       = useState<any>({});
    const [carga, setCarga]           = useState<CargaHoraria | null>(null);
    const [loading, setLoading]       = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [anio, setAnio]             = useState(new Date().getFullYear());

    useEffect(() => { cargarDatos(); }, [docenteId, anio]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [horarioRes, cargaRes] = await Promise.all([
                api.get(`/docentes/${docenteId}/horario-clases`, { params: { anio } }),
                api.get(`/docentes/${docenteId}/carga-horaria`, { params: { anio } }),
            ]);
            setHorario(horarioRes.data);
            setCarga(cargaRes.data);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const descargarPdf = async () => {
        setDownloading(true);
        try {
            const res = await api.get(`/docentes/${docenteId}/horario-pdf`, {
                params: { anio },
                responseType: 'blob',
            });
            const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href     = url;
            link.download = `Horario_Docente_${anio}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Estadísticas de carga horaria */}
            {carga && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Clases"
                        value={`${carga.total_clases} / semana`}
                        icon={BarChart3}
                        color="text-blue-600"
                        iconBg="bg-blue-500"
                    />
                    <StatCard
                        title="Horas Semanales"
                        value={`${carga.total_horas_semana}h`}
                        icon={Clock}
                        color="text-purple-600"
                        iconBg="bg-purple-500"
                    />
                    <StatCard
                        title="Promedio Diario"
                        value={`${carga.promedio_horas_dia}h`}
                        icon={TrendingUp}
                        color="text-emerald-600"
                        iconBg="bg-emerald-500"
                    />
                    <StatCard
                        title="Estado"
                        value={carga.total_horas_semana < 20 ? 'Normal' : 'Alta carga'}
                        icon={BarChart3}
                        color={carga.total_horas_semana < 20 ? 'text-emerald-600' : 'text-amber-600'}
                        iconBg={carga.total_horas_semana < 20 ? 'bg-emerald-500' : 'bg-amber-500'}
                    />
                </div>
            )}

            {/* Controles */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Año Escolar:</label>
                    <select
                        value={anio}
                        onChange={(e) => setAnio(parseInt(e.target.value))}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        {[2024, 2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-600 border-red-200 hover:bg-red-50"
                    title="Descargar PDF"
                    disabled={downloading}
                    onClick={descargarPdf}
                >
                    <Download className={`h-4 w-4 ${downloading ? 'animate-pulse' : ''}`} />
                </Button>
            </div>

            {/* Horario semanal */}
            <HorarioSemanal
                horario={horario}
                editable={false}
                showDocente={false}
                showSeccion={true}
            />
        </div>
    );
}
