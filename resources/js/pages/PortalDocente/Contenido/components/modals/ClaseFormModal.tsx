import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

interface Props {
    open: boolean;
    onClose: () => void;
    clase?: any; // If present, it's edit mode
    unidadId?: number; // Required for create mode
    onSuccess: () => void;
}

export default function ClaseFormModal({ open, onClose, clase, unidadId, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [formData, setFormData] = useState<{
        titulo: string;
        descripcion: string;
        estado: string;
    }>({
        titulo: '',
        descripcion: '',
        estado: '1'
    });

    const isEdit = !!clase;

    useEffect(() => {
        if (open) setStatus(null);
        if (isEdit) {
            setFormData({
                titulo: clase.titulo || '',
                descripcion: clase.descripcion || '',
                estado: String(clase.estado ?? '1')
            });
        } else {
            setFormData({
                titulo: '',
                descripcion: '',
                estado: '1'
            });
        }
    }, [clase, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        try {
            if (isEdit) {
                await api.put(`/contenido/clases/${clase.clase_id}`, formData);
                setStatus({ type: 'success', message: '¡Sesión actualizada con éxito!' });
            } else {
                await api.post('/contenido/clases', { ...formData, unidad_id: unidadId });
                setStatus({ type: 'success', message: '¡Sesión creada con éxito!' });
            }
            onSuccess();
            setTimeout(() => onClose(), 1500);
        } catch (error: any) {
            console.error('Error saving clase:', error);
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.message || 'Ocurrió un error al guardar los cambios.' 
            });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className={`size-12 rounded-2xl flex items-center justify-center ${isEdit ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                            {isEdit ? <FileText size={20} className="text-emerald-600" /> : <Plus size={20} className="text-blue-600" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">{isEdit ? 'Editar Sesión' : 'Nueva Sesión'}</h2>
                            <p className="text-xs text-gray-500 font-bold">{isEdit ? 'Modifica el título y descripción de la clase' : 'Define el título y contenido de la nueva sesión'}</p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onClose}
                        className="size-10 rounded-2xl hover:bg-gray-100"
                    >
                        <X size={18} />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {status && (
                        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200 ${
                            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                            <div className={`size-2 rounded-full ${status.type === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            {status.message}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700 uppercase tracking-widest text-[10px]">Título de la Sesión *</Label>
                        <Input 
                            value={formData.titulo}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                            placeholder="Ej: Introducción a la Geometría"
                            className="h-12 rounded-2xl font-bold border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700 uppercase tracking-widest text-[10px]">Descripción / Contenido</Label>
                        <Textarea 
                            value={formData.descripcion}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                            placeholder="Escribe aquí las instrucciones para el alumno, el contenido de la sesión o cualquier detalle relevante..."
                            className="rounded-2xl font-bold min-h-[200px] border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                            rows={8}
                        />
                    </div>

                    {isEdit && (
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 uppercase tracking-widest text-[10px]">Estado</Label>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio"
                                        checked={formData.estado === '1'}
                                        onChange={() => setFormData(prev => ({ ...prev, estado: '1' }))}
                                        className="size-4 text-emerald-600"
                                    />
                                    <span className="text-sm font-bold text-gray-700">Activo / Visible</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio"
                                        checked={formData.estado === '0'}
                                        onChange={() => setFormData(prev => ({ ...prev, estado: '0' }))}
                                        className="size-4 text-red-600"
                                    />
                                    <span className="text-sm font-bold text-gray-700">Inactivo / Oculto</span>
                                </label>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                    <Button 
                        type="button"
                        variant="ghost" 
                        onClick={onClose}
                        className="h-12 px-6 rounded-2xl font-bold hover:bg-white"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        disabled={loading || !formData.titulo}
                        className={`h-12 px-8 rounded-2xl font-bold gap-2 shadow-lg ${isEdit ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'} text-white`}
                    >
                        {isEdit ? <Save size={16} /> : <Plus size={16} />}
                        {loading ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Crear Sesión')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
