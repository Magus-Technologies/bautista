import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Clock, Award, Filter, Search, Edit3, Trash2, Eye, EyeOff, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import EditActivityModal from '../components/modals/EditActivityModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router } from '@inertiajs/react';

interface Props {
    courseData: any;
    docenteCursoId: number;
    onRefresh: () => void;
}

interface Actividad {
    actividad_id: number;
    nombre_actividad: string;
    descripcion_corta: string;
    fecha_inicio: string;
    fecha_cierre: string;
    nota_actividad: string;
    es_calificado: string;
    nota_visible: string;
    ocultar_actividad: string;
    estado: string;
    tipo_actividad: {
        tipo_id: number;
        nombre: string;
    };
    clase: {
        clase_id: number;
        titulo: string;
    };
}

const tipoColors: Record<string, { bg: string; text: string; border: string }> = {
    'Tarea': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    'Examen': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
    'Cuestionario': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    'Dibujo': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    'Rompecabezas': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
};

export default function ActividadesTab({ courseData, docenteCursoId, onRefresh }: Props) {
    const [actividades, setActividades] = useState<Actividad[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState<string>('');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);

    useEffect(() => {
        if (courseData?.curso_id) {
            loadActividades();
        }
    }, [courseData]);

    const loadActividades = async () => {
        try {
            setLoading(true);
            const response = await api.get('/actividades', {
                params: { curso_id: courseData.curso_id }
            });
            setActividades(response.data.data || []);
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await api.delete(`/actividades/${deletingId}`);
            loadActividades();
            onRefresh();
        } finally {
            setDeletingId(null);
        }
    };

    const toggleVisibility = async (id: number, currentValue: string) => {
        try {
            await api.put(`/actividades/${id}`, {
                ocultar_actividad: currentValue === '1' ? '0' : '1'
            });
            loadActividades();
        } catch (error) {
            console.error('Error toggling visibility:', error);
        }
    };

    const handleViewSubmissions = (actividadId: number) => {
        router.visit(`/docente/actividades/${actividadId}/entregas?back=/docente/cursos/${docenteCursoId}/contenido`);
    };

    const filteredActividades = actividades.filter(act => {
        const matchesSearch = act.nombre_actividad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            act.descripcion_corta?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTipo = !filterTipo || act.tipo_actividad?.nombre === filterTipo;
        return matchesSearch && matchesTipo;
    });

    const tiposUnicos = Array.from(new Set(actividades.map(a => a.tipo_actividad?.nombre).filter(Boolean)));

    const formatDate = (dateString: string) => {
        if (!dateString) return 'No definida';
        try {
            return format(new Date(dateString), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
        } catch {
            return dateString;
        }
    };

    const getStatusBadge = (actividad: Actividad) => {
        const now = new Date();
        const inicio = new Date(actividad.fecha_inicio);
        const cierre = new Date(actividad.fecha_cierre);

        if (actividad.ocultar_actividad === '1') {
            return <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">Oculta</span>;
        }
        if (now < inicio) {
            return <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-600">Programada</span>;
        }
        if (now > cierre) {
            return <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">Cerrada</span>;
        }
        return <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600">Activa</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin size-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Actividades del Curso</h2>
                    <p className="text-gray-500 text-sm">Gestiona tareas, exámenes y cuestionarios.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar actividades..."
                        className="h-12 pl-12 rounded-2xl font-bold"
                    />
                </div>
                <div className="relative">
                    <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select 
                        value={filterTipo}
                        onChange={(e) => setFilterTipo(e.target.value)}
                        className="h-12 pl-12 pr-4 rounded-2xl border border-gray-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[200px]"
                    >
                        <option value="">Todos los tipos</option>
                        {tiposUnicos.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Activities List */}
            <div className="grid gap-4">
                {filteredActividades.length === 0 ? (
                    <Card className="rounded-[2.5rem] p-12 text-center">
                        <Sparkles size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-bold">No hay actividades creadas aún</p>
                        <p className="text-sm text-gray-400 mt-2">Las actividades se crean desde la pestaña Contenido</p>
                    </Card>
                ) : (
                    filteredActividades.map((actividad) => {
                        const tipoStyle = tipoColors[actividad.tipo_actividad?.nombre] || tipoColors['Tarea'];
                        
                        return (
                            <Card key={actividad.actividad_id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-md transition-all overflow-hidden">
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                        {/* Left: Activity Info */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className={`size-12 rounded-2xl ${tipoStyle.bg} flex items-center justify-center`}>
                                                    <Sparkles size={20} className={tipoStyle.text} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-black text-lg text-gray-900 leading-tight">{actividad.nombre_actividad}</h3>
                                                    <p className="text-xs text-gray-500 font-bold mt-1">
                                                        {actividad.clase?.titulo || 'Sin clase asignada'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(actividad)}
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${tipoStyle.bg} ${tipoStyle.text}`}>
                                                        {actividad.tipo_actividad?.nombre}
                                                    </span>
                                                </div>
                                            </div>

                                            {actividad.descripcion_corta && (
                                                <p className="text-sm text-gray-600 font-medium">{actividad.descripcion_corta}</p>
                                            )}

                                            {/* Dates and Points */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl">
                                                    <Calendar size={16} className="text-emerald-600 mt-0.5" />
                                                    <div>
                                                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Apertura</p>
                                                        <p className="text-xs font-bold text-gray-700 mt-1">{formatDate(actividad.fecha_inicio)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-xl">
                                                    <Clock size={16} className="text-rose-600 mt-0.5" />
                                                    <div>
                                                        <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Cierre</p>
                                                        <p className="text-xs font-bold text-gray-700 mt-1">{formatDate(actividad.fecha_cierre)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
                                                    <Award size={16} className="text-amber-600 mt-0.5" />
                                                    <div>
                                                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Puntos</p>
                                                        <p className="text-xs font-bold text-gray-700 mt-1">{actividad.nota_actividad || '20'} pts</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Options */}
                                            <div className="flex flex-wrap gap-2">
                                                {actividad.es_calificado === '1' && (
                                                    <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-purple-50 text-purple-600">Calificada</span>
                                                )}
                                                {actividad.nota_visible === '1' && (
                                                    <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-blue-50 text-blue-600">Nota Visible</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex lg:flex-col gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleViewSubmissions(actividad.actividad_id)}
                                                className="rounded-xl text-purple-600 hover:bg-purple-50 font-bold text-xs gap-2 px-3 h-10 border border-purple-100"
                                                title="Ver entregas y calificar"
                                            >
                                                <FileCheck size={14} />
                                                Ver Entregas
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => toggleVisibility(actividad.actividad_id, actividad.ocultar_actividad)}
                                                className="size-10 rounded-xl text-emerald-600 hover:bg-emerald-50"
                                                title={actividad.ocultar_actividad === '1' ? 'Mostrar' : 'Ocultar'}
                                            >
                                                {actividad.ocultar_actividad === '1' ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => setEditingActividad(actividad)}
                                                className="size-10 rounded-xl text-blue-600 hover:bg-blue-50"
                                                title="Editar"
                                            >
                                                <Edit3 size={16} />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => setDeletingId(actividad.actividad_id)}
                                                className="size-10 rounded-xl text-red-600 hover:bg-red-50"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            <ConfirmDeleteModal 
                open={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={handleDelete}
                title="Eliminar Actividad"
                message="¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer y se perderán todas las entregas de los estudiantes."
            />

            <EditActivityModal
                open={!!editingActividad}
                onClose={() => setEditingActividad(null)}
                actividad={editingActividad}
                onSuccess={() => { loadActividades(); onRefresh(); }}
            />
        </div>
    );
}
