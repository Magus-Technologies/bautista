import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, FileText, Download, Upload, ClipboardList, CheckCircle2, AlertCircle, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import api from '@/lib/api';

export default function ClaseVer({ claseId }: { claseId: number }) {
    const [clase, setClase] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<number | null>(null);

    useEffect(() => {
        api.get(`/alumno/clase/${claseId}`)
            .then(res => setClase(res.data))
            .finally(() => setLoading(false));
    }, [claseId]);

    const handleUpload = (actividadId: number, allowedFormats?: string[]) => {
        const formats = allowedFormats && allowedFormats.length > 0 ? allowedFormats : ['pdf', 'doc', 'docx', 'jpg', 'png'];
        const accept = formats.map(f => {
            const map: Record<string, string> = {
                pdf: '.pdf', docx: '.docx', doc: '.doc', jpg: '.jpg,.jpeg',
                png: '.png', xlsx: '.xlsx', zip: '.zip', gif: '.gif',
            };
            return map[f] ?? `.${f}`;
        }).join(',');

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 3 * 1024 * 1024) {
                alert('El archivo supera el límite de 3 MB. Por favor elige un archivo más pequeño.');
                return;
            }

            const formData = new FormData();
            formData.append('archivo', file);

            setSubmitting(actividadId);
            api.post(`/alumno/actividad/${actividadId}/entregar`, formData)
                .then(() => {
                    // Update local state to show "Entregado"
                    setClase((prev: any) => ({
                        ...prev,
                        actividades: prev.actividades.map((a: any) => 
                            a.actividad_id === actividadId ? { ...a, entregado: true } : a
                        )
                    }));
                })
                .catch(err => alert('Error al subir archivo: ' + err.response?.data?.message))
                .finally(() => setSubmitting(null));
        };
        input.click();
    };

    if (loading) {
        return <div className="p-10 text-center font-black animate-pulse text-indigo-600">Preparando el aula virtual...</div>;
    }

    if (!clase) {
        return (
            <AppSidebarLayout>
                <div className="p-20 text-center space-y-6">
                    <div className="size-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                        <AlertCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">No pudimos cargar esta clase</h2>
                    <p className="text-gray-500 font-bold">Es posible que no tengas permisos para ver este contenido o la clase ya no exista.</p>
                    <Link href="/cursos">
                        <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black px-8 h-12">Volver a mis cursos</Button>
                    </Link>
                </div>
            </AppSidebarLayout>
        );
    }

    return (
        <AppSidebarLayout>
            <div className="min-h-screen bg-[#F8F9FC] p-4 md:p-8 space-y-8 font-sans">
                <Head title={clase.titulo} />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <Link href={`/alumno/cursos/${clase.docen_curso_id || clase.unidad?.curso_id}`}>
                            <Button variant="ghost" className="h-10 w-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 p-0">
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </Button>
                        </Link>
                        <div>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{clase.unidad?.titulo}</p>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{clase.titulo}</h1>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Main Content: Info & Materials */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 md:p-10 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-indigo-600" /> Descripción de la Sesión
                                </h3>
                                <div 
                                    className="text-gray-600 leading-relaxed font-medium prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ 
                                        __html: clase.descripcion || 'No hay descripción disponible para esta sesión.' 
                                    }}
                                />
                            </div>

                            <div className="space-y-4 pt-6 border-t border-gray-50">
                                <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider">
                                    Recursos Descargables
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {clase.archivos.length === 0 ? (
                                        <div className="col-span-2 py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <p className="text-xs text-gray-400 font-bold">No hay archivos adjuntos para esta clase.</p>
                                        </div>
                                    ) : (
                                        clase.archivos.map((archivo: any) => (
                                            <a key={archivo.archivo_id} href={archivo.url || `/storage/${archivo.path}`} target="_blank" className="flex flex-col p-4 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                                                <div className="flex items-center mb-2">
                                                    <div className="bg-gray-50 p-2.5 rounded-xl text-gray-500 group-hover:text-indigo-600 transition-colors shrink-0">
                                                        <Download className="w-4 h-4" />
                                                    </div>
                                                    <div className="ml-3 flex-1 overflow-hidden">
                                                        <p className="text-[11px] font-black text-gray-800 truncate uppercase tracking-tight">
                                                            {archivo.titulo || archivo.nombre || 'Documento de apoyo'}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                            {archivo.tipo || 'Archivo'} • {archivo.tamanio ? `${(archivo.tamanio / 1024).toFixed(1)} KB` : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {archivo.descripcion && (
                                                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-2 mt-1">
                                                        {archivo.descripcion}
                                                    </p>
                                                )}
                                            </a>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Activities */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center">
                                    <ClipboardList className="w-4 h-4 mr-2 text-indigo-600" /> Tareas y Actividades
                                </h4>
                                <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-full">
                                    {clase.actividades.length}
                                </span>
                            </div>
                            
                            <div className="p-4 space-y-4">
                                {clase.actividades.map((act: any) => {
                                    const typeId = act.id_tipo_actividad || act.tipo_id;
                                    const isQuiz = typeId == 2 || typeId == 3;
                                    const isDrawing = typeId == 5;
                                    const isPuzzle = typeId == 6;
                                    const isCompleted = Boolean(act.entregado) || (isQuiz && act.nota !== null && act.nota !== undefined);
                                    
                                    return (
                                        <div key={act.actividad_id} className={`rounded-2xl border transition-all overflow-hidden ${
                                            isCompleted 
                                            ? 'bg-emerald-50/30 border-emerald-100' 
                                            : 'bg-white border-gray-100 shadow-sm'
                                        }`}>
                                            <div className="p-5 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                                isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600'
                                                            }`}>
                                                                {act.tipo_actividad?.nombre || 'Tarea'}
                                                            </span>
                                                        </div>
                                                        <p className="font-bold text-sm text-gray-900 leading-snug">
                                                            {act.nombre_actividad}
                                                        </p>
                                                    </div>
                                                    {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                                </div>

                                                {/* Instrucciones del maestro (NUEVO) */}
                                                {act.descripcion_larga && (
                                                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                                                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Instrucciones</p>
                                                        <p className="text-[11px] text-amber-900/80 font-medium leading-relaxed">
                                                            {act.descripcion_larga}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-[10px] font-bold py-2 border-y border-gray-50">
                                                    <div className="flex items-center text-gray-400">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        <span>Vence:</span>
                                                    </div>
                                                    <span className={isCompleted ? 'text-emerald-600' : 'text-rose-500'}>
                                                        {act.fecha_cierre ? format(new Date(act.fecha_cierre), "d 'de' MMM", { locale: es }) : 'N/A'}
                                                    </span>
                                                </div>
                                                
                                                {/* Archivos del docente */}
                                                {act.archivos_docente?.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Material adjunto</p>
                                                        {act.archivos_docente.map((archivo: any, i: number) => (
                                                            <a key={i} href={archivo.url} target="_blank"
                                                                className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all">
                                                                <Download className="w-3 h-3 text-gray-400" />
                                                                <span className="text-[10px] font-bold text-gray-600 truncate">{archivo.nombre}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}

                                                {isQuiz ? (
                                                    isCompleted ? (
                                                        <div className="text-center py-2 bg-emerald-100 rounded-xl text-emerald-700 font-black text-[10px] uppercase">
                                                            Nota: {act.nota || 'Pendiente'}
                                                        </div>
                                                    ) : (
                                                        <Link href={`/alumno/examen/${act.actividad_id}/resolver`} className="block">
                                                            <Button className="w-full h-9 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-black text-[10px] uppercase">
                                                                Realizar Examen
                                                            </Button>
                                                        </Link>
                                                    )
                                                ) : isDrawing ? (
                                                    <Link href={`/alumno/dibujo/${act.actividad_id}`} className="block">
                                                        <Button className="w-full h-9 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-black text-[10px] uppercase">
                                                            Abrir Lienzo
                                                        </Button>
                                                    </Link>
                                                ) : isPuzzle ? (
                                                    <Link href={`/alumno/puzzles/${act.actividad_id}`} className="block">
                                                        <Button className="w-full h-9 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-black text-[10px] uppercase">
                                                            Resolver Puzzle
                                                        </Button>
                                                    </Link>
                                                ) : act.entregado ? (
                                                    <div className="flex items-center justify-center p-2 rounded-xl bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase gap-2">
                                                        ✅ Enviado {act.nota && `| Nota: ${act.nota}`}
                                                    </div>
                                                ) : (
                                                    <Button 
                                                        onClick={() => handleUpload(act.actividad_id, act.allowed_formats)}
                                                        disabled={submitting === act.actividad_id}
                                                        className="w-full h-9 rounded-xl bg-gray-900 hover:bg-black text-white font-black text-[10px] uppercase"
                                                    >
                                                        {submitting === act.actividad_id ? 'Subiendo...' : 'Entregar Tarea'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {clase.actividades.length === 0 && (
                                    <div className="py-10 text-center">
                                        <p className="text-xs text-gray-400 font-bold italic">No hay tareas programadas.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50">
                            <div className="flex items-center space-x-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-indigo-600" />
                                <h4 className="text-xs font-black text-indigo-900 uppercase">Información</h4>
                            </div>
                            <p className="text-[11px] font-medium text-indigo-700/70 leading-relaxed">
                                Revisa los materiales y completa las actividades para avanzar en tu progreso académico.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </AppSidebarLayout>
    );
}
