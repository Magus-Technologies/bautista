import React, { useState, useRef } from 'react';
import { Plus, BookOpen, Edit3, Trash2, ChevronDown, FileText, Upload, Sparkles, ChevronRight, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import PromptModal from '@/components/shared/PromptModal';
import CreateActivityModal from '../components/modals/CreateActivityModal';
import UploadFileModal from '../components/modals/UploadFileModal';
import ClaseFormModal from '../components/modals/ClaseFormModal';
import EditArchivoModal from '../components/modals/EditArchivoModal';

interface Props {
    unidades: any[];
    expanded: Record<string, boolean>;
    setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    docenteCursoId: number;
    courseData: any;
    onRefresh: () => void;
}

export default function ContenidoTab({ unidades, expanded, setExpanded, docenteCursoId, courseData, onRefresh }: Props) {
    const [deletingId, setDeletingId] = useState<{ id: number; type: 'unidad' | 'clase' | 'archivo' } | null>(null);
    const [editingClase, setEditingClase] = useState<any>(null);
    const [creatingClaseInUnidad, setCreatingClaseInUnidad] = useState<number | null>(null);
    const [editingArchivo, setEditingArchivo] = useState<any>(null);
    const [promptConfig, setPromptConfig] = useState<{
        open: boolean;
        title: string;
        message?: string;
        defaultValue?: string;
        action: (value: string) => Promise<void> | void;
    }>({ open: false, title: '', action: () => {} });
    const [uploadingClaseId, setUploadingClaseId] = useState<number | null>(null);
    const [creatingActivityFor, setCreatingActivityFor] = useState<{ claseId: number; cursoId: number } | null>(null);
    const [expandedFiles, setExpandedFiles] = useState<Record<number, boolean>>({});
    const [expandedClases, setExpandedClases] = useState<Record<number, boolean>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleSection = (id: number) => {
        setExpanded((s: any) => ({ ...s, [id]: !s[id] }));
    };

    const toggleClase = (id: number) => {
        setExpandedClases(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const addUnidad = () => {
        if (!courseData?.curso_id) return;
        setPromptConfig({
            open: true,
            title: 'Nueva Unidad',
            message: 'Nombre de la nueva unidad académica:',
            defaultValue: '',
            action: async (titulo) => {
                await api.post('/contenido/unidades', { curso_id: courseData.curso_id, titulo });
                setPromptConfig(prev => ({ ...prev, open: false }));
                onRefresh();
            }
        });
    };

    const addClase = (unidadId: number) => {
        setCreatingClaseInUnidad(unidadId);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        try {
            if (deletingId.type === 'unidad') {
                await api.delete(`/contenido/unidades/${deletingId.id}`);
            } else if (deletingId.type === 'clase') {
                await api.delete(`/contenido/clases/${deletingId.id}`);
            } else if (deletingId.type === 'archivo') {
                await api.delete(`/contenido/archivos/${deletingId.id}`);
            }
            onRefresh();
        } finally {
            setDeletingId(null);
        }
    };

    const renameUnidad = async (id: number, current: string) => {
        setPromptConfig({
            open: true,
            title: 'Renombrar Unidad',
            message: 'Ingresa el nuevo título para la unidad:',
            defaultValue: current,
            action: async (nuevo) => {
                if (nuevo !== current) {
                    await api.put(`/contenido/unidades/${id}`, { titulo: nuevo });
                }
                setPromptConfig(prev => ({ ...prev, open: false }));
                onRefresh();
            }
        });
    };

    const renameClase = (clase: any) => {
        setEditingClase(clase);
    };

    const editArchivo = (archivo: any) => {
        setEditingArchivo(archivo);
    };

    const handleFileUpload = async (claseId: number) => {
        setUploadingClaseId(claseId);
    };

    const handleCreateActivity = (claseId: number) => {
        if (!courseData?.curso_id) return;
        setCreatingActivityFor({ claseId, cursoId: courseData.curso_id });
    };

    const toggleFileExpand = (archivoId: number) => {
        setExpandedFiles(prev => ({ ...prev, [archivoId]: !prev[archivoId] }));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Material de Curso</h2>
                    <p className="text-gray-500 text-sm">Gestiona fichas, guías y documentos de estudio.</p>
                </div>
                <Button 
                    onClick={addUnidad}
                    className="rounded-[1.25rem] h-12 px-6 bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 shadow-lg shadow-emerald-100"
                >
                    <Plus size={18} /> Nueva Unidad
                </Button>
            </div>

            <div className="grid gap-4">
                {unidades.map((unidad: any) => (
                    <Card key={unidad.unidad_id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group bg-white">
                        <div 
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 cursor-pointer"
                            onClick={() => toggleSection(unidad.unidad_id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${expanded[unidad.unidad_id] ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-gray-50 text-gray-400 group-hover:bg-emerald-50'}`}>
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors uppercase text-[15px]">{unidad.titulo}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{unidad.clases?.length || 0} Sesiones Publicadas</p>
                                </div>
                            </div>
                            <div className="flex items-center flex-wrap gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={(e) => { e.stopPropagation(); addClase(unidad.unidad_id); }}
                                    className="rounded-xl border-gray-100 font-bold text-[10px] uppercase h-9 hover:bg-emerald-50 hover:text-emerald-600"
                                >
                                    + Sesión
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => { e.stopPropagation(); renameUnidad(unidad.unidad_id, unidad.titulo); }}
                                    className="size-9 rounded-xl text-emerald-600 hover:bg-emerald-50"
                                >
                                    <Edit3 size={14} />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => { e.stopPropagation(); setDeletingId({ id: unidad.unidad_id, type: 'unidad' }); }}
                                    className="size-9 rounded-xl text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 size={14} />
                                </Button>
                                <div className={`p-2 rounded-xl transition-all ${expanded[unidad.unidad_id] ? 'rotate-180 bg-gray-100' : 'bg-gray-50'}`}>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {expanded[unidad.unidad_id] && (
                            <div className="px-6 pb-6 bg-white animate-in slide-in-from-top-2 duration-300">
                                <div className="border-t border-gray-100 pt-4 space-y-3">
                                    {unidad.clases?.map((clase: any) => (
                                        <div key={clase.clase_id} className="rounded-3xl border border-gray-100 hover:border-emerald-100 transition-all overflow-hidden bg-white group/clase">
                                            <div 
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 cursor-pointer hover:bg-gray-50/50"
                                                onClick={() => toggleClase(clase.clase_id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-8 rounded-xl flex items-center justify-center transition-all ${expandedClases[clase.clase_id] ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        <FileText size={14} />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700">{clase.titulo}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={(e) => { e.stopPropagation(); handleFileUpload(clase.clase_id); }}
                                                        className="rounded-xl border-emerald-100 font-bold text-[10px] uppercase h-8 hover:bg-emerald-50 hover:text-emerald-600 gap-1"
                                                    >
                                                        <Upload size={12} /> Archivo
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={(e) => { e.stopPropagation(); handleCreateActivity(clase.clase_id); }}
                                                        className="rounded-xl border-purple-100 font-bold text-[10px] uppercase h-8 hover:bg-purple-50 hover:text-purple-600 gap-1"
                                                    >
                                                        <Sparkles size={12} /> Actividad
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={(e) => { e.stopPropagation(); renameClase(clase); }}
                                                        className="size-8 rounded-full text-emerald-600 hover:bg-emerald-50"
                                                        title="Editar Sesión"
                                                    >
                                                        <Edit3 size={14} />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={(e) => { e.stopPropagation(); setDeletingId({ id: clase.clase_id, type: 'clase' }); }}
                                                        className="size-8 rounded-full text-red-600 hover:bg-red-50"
                                                        title="Eliminar Sesión"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                    <div className={`transition-transform duration-300 ${expandedClases[clase.clase_id] ? 'rotate-180' : ''}`}>
                                                        <ChevronDown size={14} className="text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Files and Activities */}
                                            {expandedClases[clase.clase_id] && (
                                                <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-4 animate-in slide-in-from-top-2 duration-300">
                                                    {/* Files */}
                                                    {clase.archivos?.length > 0 ? (
                                                        <div className="space-y-2">
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Archivos ({clase.archivos.length})</p>
                                                            <div className="space-y-2">
                                                                {clase.archivos.map((f: any) => (
                                                                    <div key={f.archivo_id} className="border border-gray-100 rounded-xl overflow-hidden bg-white hover:border-blue-200 transition-all">
                                                                        <div 
                                                                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                                                                            onClick={() => toggleFileExpand(f.archivo_id)}
                                                                        >
                                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                                <div className={`transition-transform ${expandedFiles[f.archivo_id] ? 'rotate-90' : ''}`}>
                                                                                    <ChevronRight size={14} className="text-gray-400" />
                                                                                </div>
                                                                                <FileText size={16} className="text-blue-600 flex-shrink-0" />
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-sm font-bold text-gray-900 truncate">{f.titulo || f.nombre}</p>
                                                                                    <p className="text-[10px] text-gray-400">{(f.tamanio / 1024 / 1024).toFixed(2)} MB</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <Button 
                                                                                    variant="ghost" 
                                                                                    size="icon"
                                                                                    onClick={(e) => { e.stopPropagation(); editArchivo(f); }}
                                                                                    className="size-8 rounded-lg text-emerald-600 hover:bg-emerald-50"
                                                                                    title="Editar metadatos"
                                                                                >
                                                                                    <Edit3 size={14} />
                                                                                </Button>
                                                                                <Button 
                                                                                    variant="ghost" 
                                                                                    size="icon"
                                                                                    onClick={(e) => { e.stopPropagation(); window.open(`/storage/${f.path}`, '_blank'); }}
                                                                                    className="size-8 rounded-lg text-blue-600 hover:bg-blue-50"
                                                                                    title="Ver archivo"
                                                                                >
                                                                                    <Eye size={14} />
                                                                                </Button>
                                                                                <Button 
                                                                                    variant="ghost" 
                                                                                    size="icon"
                                                                                    onClick={(e) => { e.stopPropagation(); setDeletingId({ id: f.archivo_id, type: 'archivo' }); }}
                                                                                    className="size-8 rounded-lg text-red-600 hover:bg-red-50"
                                                                                    title="Eliminar"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {expandedFiles[f.archivo_id] && (
                                                                            <div className="px-3 pb-3 pt-0 border-t border-gray-100 bg-gray-50 animate-in slide-in-from-top-2 duration-200">
                                                                                <div className="space-y-2 mt-3">
                                                                                    {f.descripcion && (
                                                                                        <div>
                                                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Descripción</p>
                                                                                            <p className="text-xs text-gray-600">{f.descripcion}</p>
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                        <div>
                                                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tipo</p>
                                                                                            <p className="text-gray-700 font-bold">{f.tipo || 'N/A'}</p>
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tamaño</p>
                                                                                            <p className="text-gray-700 font-bold">{(f.tamanio / 1024 / 1024).toFixed(2)} MB</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <a 
                                                                                        href={`/storage/${f.path}`}
                                                                                        download
                                                                                        className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                                                                                    >
                                                                                        <Download size={12} />
                                                                                        Descargar Archivo
                                                                                    </a>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 border-2 border-dashed border-gray-100 rounded-3xl">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sin archivos adjuntos</p>
                                                        </div>
                                                    )}

                                                    {/* Activities */}
                                                    {clase.actividades?.length > 0 && (
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Actividades</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {clase.actividades.map((act: any) => (
                                                                    <div key={act.actividad_id} className="flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-2 rounded-xl text-[11px] font-bold">
                                                                        <Sparkles size={12} className="text-purple-600" />
                                                                        <span className="text-gray-700">{act.nombre_actividad}</span>
                                                                        <span className="text-[9px] text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">{act.tipo_actividad?.nombre}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(!unidad.clases || unidad.clases.length === 0) && (
                                        <p className="text-center py-6 text-xs font-bold text-gray-400 italic">No hay sesiones creadas en esta unidad.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            <ConfirmDeleteModal 
                open={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={confirmDelete}
                title={deletingId?.type === 'unidad' ? 'Eliminar Unidad' : (deletingId?.type === 'clase' ? 'Eliminar Sesión' : 'Eliminar Archivo')}
                message={`¿Estás seguro de que deseas eliminar este ${deletingId?.type === 'unidad' ? 'unidad y todo su contenido' : (deletingId?.type === 'clase' ? 'sesión' : 'archivo')}? Esta acción no se puede deshacer.`}
            />

            <PromptModal 
                open={promptConfig.open}
                onClose={() => setPromptConfig(prev => ({ ...prev, open: false }))}
                onConfirm={promptConfig.action}
                title={promptConfig.title}
                message={promptConfig.message}
                defaultValue={promptConfig.defaultValue}
            />

            <input 
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.avi,.mov,.jpg,.jpeg,.png"
            />

            <ClaseFormModal 
                open={!!editingClase || !!creatingClaseInUnidad}
                onClose={() => {
                    setEditingClase(null);
                    setCreatingClaseInUnidad(null);
                }}
                clase={editingClase}
                unidadId={creatingClaseInUnidad || 0}
                onSuccess={onRefresh}
            />

            <EditArchivoModal 
                open={!!editingArchivo}
                onClose={() => setEditingArchivo(null)}
                archivo={editingArchivo}
                onSuccess={onRefresh}
            />

            <UploadFileModal 
                open={!!uploadingClaseId}
                onClose={() => setUploadingClaseId(null)}
                claseId={uploadingClaseId || 0}
                onSuccess={() => {
                    setUploadingClaseId(null);
                    onRefresh();
                }}
            />

            {creatingActivityFor && (
                <CreateActivityModal 
                    open={!!creatingActivityFor}
                    onClose={() => setCreatingActivityFor(null)}
                    claseId={creatingActivityFor.claseId}
                    cursoId={creatingActivityFor.cursoId}
                    onSuccess={() => {
                        setCreatingActivityFor(null);
                        onRefresh();
                    }}
                />
            )}
        </div>
    );
}
