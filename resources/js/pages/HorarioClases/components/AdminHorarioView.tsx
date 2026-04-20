import { Copy, Download, Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import HorarioSemanal from '@/pages/HorarioClases/components/HorarioSemanal';
import ClaseModal from '@/pages/HorarioClases/components/ClaseModal';
import ClonarHorarioModal from '@/pages/HorarioClases/components/ClonarHorarioModal';

type Seccion = {
    seccion_id: number;
    nombre: string;
    grado?: { nombre_grado: string };
};

export default function AdminHorarioView() {
    const [secciones, setSecciones] = useState<Seccion[]>([]);
    const [seccionSeleccionada, setSeccionSeleccionada] = useState<number | null>(null);
    const [horario, setHorario] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [anio, setAnio] = useState(new Date().getFullYear());
    
    // Modales
    const [claseModal, setClaseModal] = useState<{ open: boolean; clase?: any }>({ open: false });
    const [clonarModal, setClonarModal] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const descargarPdf = async () => {
        if (!seccionSeleccionada) return;
        setDownloading(true);
        try {
            const res = await api.get(`/secciones/${seccionSeleccionada}/horario-pdf`, {
                params: { anio },
                responseType: 'blob',
            });
            const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href     = url;
            link.download = `Horario_${seccionActual?.nombre ?? 'Seccion'}_${anio}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        cargarSecciones();
    }, []);

    useEffect(() => {
        if (seccionSeleccionada) {
            cargarHorario();
        }
    }, [seccionSeleccionada, anio]);

    const cargarSecciones = async () => {
        try {
            const response = await api.get('/secciones');
            setSecciones(response.data.data || []);
            if (response.data.data?.length > 0) {
                setSeccionSeleccionada(response.data.data[0].seccion_id);
            }
        } catch (error) {
            console.error('Error al cargar secciones:', error);
        }
    };

    const cargarHorario = async () => {
        if (!seccionSeleccionada) return;
        
        setLoading(true);
        try {
            const response = await api.get(`/secciones/${seccionSeleccionada}/horario`, {
                params: { anio },
            });
            setHorario(response.data);
        } catch (error) {
            console.error('Error al cargar horario:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAgregarClase = () => {
        setClaseModal({ open: true });
    };

    const handleEditarClase = (clase: any) => {
        setClaseModal({ open: true, clase });
    };

    const handleEliminarClase = async (claseId: number) => {
        if (!confirm('¿Eliminar esta clase del horario?')) return;

        try {
            await api.delete(`/horario-clases/${claseId}`);
            cargarHorario();
        } catch (error) {
            console.error('Error al eliminar clase:', error);
            alert('Error al eliminar la clase');
        }
    };

    const handleClaseGuardada = () => {
        setClaseModal({ open: false });
        cargarHorario();
    };

    const seccionActual = secciones.find((s) => s.seccion_id === seccionSeleccionada);

    return (
        <div className="space-y-6">
            {/* Selector de sección y controles */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Sección:
                        </label>
                        <select
                            value={seccionSeleccionada || ''}
                            onChange={(e) => setSeccionSeleccionada(parseInt(e.target.value))}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[200px]"
                        >
                            {secciones.map((s) => (
                                <option key={s.seccion_id} value={s.seccion_id}>
                                    {s.nombre} {s.grado && `- ${s.grado.nombre_grado}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Año:
                        </label>
                        <select
                            value={anio}
                            onChange={(e) => setAnio(parseInt(e.target.value))}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {[2024, 2025, 2026, 2027].map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 border-red-200 hover:bg-red-50"
                        title="Descargar PDF"
                        onClick={descargarPdf}
                        disabled={!seccionSeleccionada || downloading}
                    >
                        <Download className={`h-4 w-4 ${downloading ? 'animate-pulse' : ''}`} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setClonarModal(true)}
                        disabled={!seccionSeleccionada}
                    >
                        <Copy className="h-4 w-4" />
                        Clonar
                    </Button>
                    <Button
                        size="sm"
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                        onClick={handleAgregarClase}
                        disabled={!seccionSeleccionada}
                    >
                        <Plus className="h-4 w-4" />
                        Agregar Clase
                    </Button>
                </div>
            </div>

            {/* Horario */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <HorarioSemanal
                    horario={horario}
                    editable={true}
                    onEdit={handleEditarClase}
                    onDelete={handleEliminarClase}
                    showDocente={true}
                    showSeccion={false}
                />
            )}

            {/* Modales */}
            <ClaseModal
                open={claseModal.open}
                onClose={() => setClaseModal({ open: false })}
                onSaved={handleClaseGuardada}
                seccionId={seccionSeleccionada}
                anioEscolar={anio}
                clase={claseModal.clase}
            />

            <ClonarHorarioModal
                open={clonarModal}
                onClose={() => setClonarModal(false)}
                onCloned={cargarHorario}
                seccionId={seccionSeleccionada}
                anioActual={anio}
            />
        </div>
    );
}
