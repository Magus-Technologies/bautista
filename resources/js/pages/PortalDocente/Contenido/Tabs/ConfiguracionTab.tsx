import { useState, useEffect } from 'react';
import { Settings, Palette, Image as ImageIcon, Save, RotateCcw, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AlertModal from '@/components/shared/AlertModal';
import api from '@/lib/api';

interface Props {
    docenteCursoId: number;
    courseData: any;
    onRefresh: () => void;
}

interface CourseSettings {
    descripcion?: string;
    color?: string;
    banner?: string;
    weights?: Record<string, number>; // { "Tarea": 30, "Examen": 50, "Cuestionario": 20 }
}

const PRESET_COLORS = [
    { name: 'Emerald', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Pink', value: '#ec4899' },
];

export default function ConfiguracionTab({ docenteCursoId, courseData, onRefresh }: Props) {
    const DEFAULT_WEIGHTS: Record<string, number> = { Tarea: 20, Examen: 40, Cuestionario: 20, Dibujo: 10, Rompecabezas: 10 };

    const [tiposActividad, setTiposActividad] = useState<string[]>(Object.keys(DEFAULT_WEIGHTS));
    const [settings, setSettings] = useState<CourseSettings>({
        descripcion: courseData?.curso?.descripcion || '',
        color: courseData?.curso?.color || '#10b981',
        banner: courseData?.banner || '',
        weights: (courseData?.settings?.weights && Object.keys(courseData.settings.weights).length > 0)
            ? courseData.settings.weights
            : DEFAULT_WEIGHTS,
    });

    useEffect(() => {
        api.get('/actividades/tipos').then(res => {
            const nombres: string[] = (res.data ?? []).map((t: any) => t.nombre);
            setTiposActividad(nombres);
            // Si no hay weights guardados, inicializar con todos los tipos en 0 excepto los defaults
            setSettings(prev => {
                if (prev.weights && Object.keys(prev.weights).length > 0) return prev;
                const w: Record<string, number> = {};
                nombres.forEach(n => { w[n] = DEFAULT_WEIGHTS[n] ?? 0; });
                return { ...prev, weights: w };
            });
        }).catch(() => {});
    }, []);
    const [saving, setSaving] = useState(false);
    
    // Alert modal state
    const [alertModal, setAlertModal] = useState<{
        open: boolean;
        variant: 'success' | 'error' | 'warning' | 'info';
        title?: string;
        message: string;
    }>({
        open: false,
        variant: 'info',
        message: '',
    });

    // Debug: log when alertModal changes
    useEffect(() => {
        console.log('Alert modal state:', alertModal);
    }, [alertModal]);

    useEffect(() => {
        if (courseData) {
            setSettings({
                descripcion: courseData.settings?.descripcion || courseData.curso?.descripcion || '',
                color: courseData.settings?.color || courseData.curso?.color || '#10b981',
                weights: (courseData.settings?.weights && Object.keys(courseData.settings.weights).length > 0)
                    ? courseData.settings.weights
                    : DEFAULT_WEIGHTS,
            });
        }
    }, [courseData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/docente/curso/${docenteCursoId}/settings`, {
                settings: settings
            });
            onRefresh();
            setAlertModal({
                open: true,
                variant: 'success',
                message: 'Configuración guardada correctamente',
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            setAlertModal({
                open: true,
                variant: 'error',
                message: 'Error al guardar la configuración',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('¿Estás seguro de que deseas restaurar la configuración predeterminada?')) {
            setSettings({
                descripcion: courseData?.curso?.descripcion || '',
                color: courseData?.curso?.color || '#10b981',
                weights: DEFAULT_WEIGHTS,
            });
        }
    };

    const totalWeight = Object.values(settings.weights ?? {}).reduce((a, b) => a + Number(b), 0);
    const weightOk = totalWeight === 100;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Configuración del Curso</h2>
                    <p className="text-gray-500 text-sm">Personaliza la apariencia y configuración general del curso.</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        onClick={handleReset}
                        variant="outline"
                        className="rounded-2xl h-12 px-6 font-bold text-[10px] uppercase tracking-widest gap-2"
                    >
                        <RotateCcw size={16} /> Restaurar
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-2xl h-12 px-6 bg-emerald-600 hover:bg-emerald-700 font-bold text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-emerald-100"
                    >
                        <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Settings */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm p-8 bg-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                <Settings size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-gray-900">Configuración General</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Información básica del curso</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Nombre — solo lectura */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    Nombre del Curso
                                </label>
                                <div className="h-12 px-4 flex items-center rounded-xl bg-gray-50 border border-gray-100 text-gray-500 font-medium text-sm select-none">
                                    {courseData?.curso?.nombre || '—'}
                                </div>
                                <p className="text-[10px] text-gray-400 px-1">El nombre del curso solo puede ser modificado por el administrador.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    Descripción
                                </label>
                                <Textarea 
                                    value={settings.descripcion}
                                    onChange={(e) => setSettings(prev => ({ ...prev, descripcion: e.target.value }))}
                                    placeholder="Describe brevemente el contenido y objetivos del curso..."
                                    className="rounded-xl min-h-[120px] border-gray-200 font-medium resize-none"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Pesos por tipo de actividad */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm p-8 bg-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                                <BarChart2 size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-gray-900">Pesos por Tipo de Actividad</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Define cómo se calcula el promedio final</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {tiposActividad.map(tipo => {
                                const peso = settings.weights?.[tipo] ?? 0;
                                return (
                                <div key={tipo} className="flex items-center gap-4">
                                    <span className="w-32 text-sm font-bold text-gray-700 shrink-0">{tipo}</span>
                                    <div className="flex-1 relative">
                                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-amber-400 transition-all"
                                                style={{ width: `${Math.min(Number(peso), 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 w-24">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={peso}
                                            onChange={e => setSettings(prev => ({
                                                ...prev,
                                                weights: { ...prev.weights, [tipo]: Number(e.target.value) }
                                            }))}
                                            className="h-9 w-16 text-center rounded-xl border-gray-200 font-bold text-sm"
                                        />
                                        <span className="text-sm text-gray-400 font-bold">%</span>
                                    </div>
                                </div>
                                );
                            })}

                            {/* Total */}
                            <div className={`flex items-center justify-between pt-3 border-t ${weightOk ? 'border-emerald-100' : 'border-rose-100'}`}>
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Total</span>
                                <span className={`text-lg font-black ${weightOk ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {totalWeight}%
                                </span>
                            </div>
                            {!weightOk && (
                                <p className="text-xs text-rose-500 font-bold">
                                    La suma debe ser exactamente 100%. Actualmente: {totalWeight}%
                                </p>
                            )}
                            {weightOk && (
                                <p className="text-xs text-emerald-600 font-bold">✓ Los pesos suman 100%</p>
                            )}
                        </div>
                    </Card>

                    {/* Appearance Settings */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm p-8 bg-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                                <Palette size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-gray-900">Personalización Visual</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Colores y apariencia</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    Color del Curso
                                </label>
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                                    {PRESET_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setSettings(prev => ({ ...prev, color: color.value }))}
                                            className={`size-12 rounded-2xl transition-all hover:scale-110 ${
                                                settings.color === color.value 
                                                    ? 'ring-4 ring-offset-2 ring-gray-300 scale-110' 
                                                    : 'hover:ring-2 hover:ring-gray-200'
                                            }`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <Input 
                                        type="color"
                                        value={settings.color}
                                        onChange={(e) => setSettings(prev => ({ ...prev, color: e.target.value }))}
                                        className="w-20 h-12 rounded-xl cursor-pointer"
                                    />
                                    <Input 
                                        type="text"
                                        value={settings.color}
                                        onChange={(e) => setSettings(prev => ({ ...prev, color: e.target.value }))}
                                        placeholder="#10b981"
                                        className="flex-1 rounded-xl h-12 border-gray-200 font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                                <Palette size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-xs font-bold text-amber-700 leading-tight">
                                    Este color se aplicará a la cabecera y botones de este curso para personalizar tu entorno de trabajo.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-6">
                    <Card className="rounded-[2.5rem] border-none shadow-sm p-6 bg-white sticky top-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Vista Previa</p>
                                <div className="rounded-3xl overflow-hidden border border-gray-100">
                                    {/* Banner Preview */}
                                    <div 
                                        className="h-32 flex items-center justify-center text-white font-black text-lg relative overflow-hidden px-6 text-center"
                                        style={{ backgroundColor: settings.color }}
                                    >
                                        <span className="relative z-10 leading-tight">{courseData?.curso?.nombre || 'Nombre del Curso'}</span>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                    
                                    {/* Content Preview */}
                                    <div className="p-6 space-y-3">
                                        <h4 className="font-black text-gray-900 text-lg leading-tight">
                                            {courseData?.curso?.nombre || 'Nombre del Curso'}
                                        </h4>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            {settings.descripcion || 'La descripción del curso aparecerá aquí...'}
                                        </p>
                                        
                                        {/* Sample Button */}
                                        <button 
                                            className="w-full h-10 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-white transition-all"
                                            style={{ backgroundColor: settings.color }}
                                        >
                                            Botón de Ejemplo
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                <p className="text-[9px] font-bold text-blue-700 leading-relaxed">
                                    💡 Los cambios se aplicarán a todo el curso después de guardar.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Alert Modal */}
            <AlertModal
                open={alertModal.open}
                onClose={() => setAlertModal(prev => ({ ...prev, open: false }))}
                variant={alertModal.variant}
                title={alertModal.title}
                message={alertModal.message}
            />
        </div>
    );
}
