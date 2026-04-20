import { Download, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import HorarioSemanal from './HorarioSemanal';

export default function AlumnoHorarioView() {
    const [horario, setHorario] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [anio, setAnio] = useState(new Date().getFullYear());

    useEffect(() => {
        cargarHorario();
    }, [anio]);

    const cargarHorario = async () => {
        setLoading(true);
        try {
            const response = await api.get('/alumno/horario', { params: { anio } });
            setHorario(response.data.horario ?? {});
        } catch (error) {
            console.error('Error al cargar horario:', error);
        } finally {
            setLoading(false);
        }
    };

    const descargarPdf = async () => {
        setDownloading(true);
        try {
            const res = await api.get('/alumno/horario-pdf', {
                params: { anio },
                responseType: 'blob',
            });
            const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href     = url;
            link.download = `Mi_Horario_${anio}.pdf`;
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                        Año Escolar:
                    </label>
                    <select
                        value={anio}
                        onChange={(e) => setAnio(parseInt(e.target.value))}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
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

            <HorarioSemanal
                horario={horario}
                editable={false}
                showDocente={true}
                showSeccion={false}
            />
        </div>
    );
}
