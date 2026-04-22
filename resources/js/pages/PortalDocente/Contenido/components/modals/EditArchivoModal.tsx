import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

interface Props {
    open: boolean;
    onClose: () => void;
    archivo: any;
    onSuccess: () => void;
}

export default function EditArchivoModal({ open, onClose, archivo, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [formData, setFormData] = useState<{
        titulo: string;
        descripcion: string;
        visible: string;
    }>({
        titulo: '',
        descripcion: '',
        visible: '1'
    });

    useEffect(() => {
        if (open) setStatus(null);
        if (archivo) {
            setFormData({
                titulo: archivo.titulo || archivo.nombre || '',
                descripcion: archivo.descripcion || '',
                visible: String(archivo.visible ?? '1')
            });
        }
    }, [archivo, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        try {
            await api.put(`/contenido/archivos/${archivo.archivo_id}`, formData);
            setStatus({ type: 'success', message: '¡Archivo actualizado con éxito!' });
            onSuccess();
            setTimeout(() => onClose(), 1500);
        } catch (error: any) {
            console.error('Error updating archivo:', error);
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.message || 'Ocurrió un error al actualizar el archivo.' 
            });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                            <FileText size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Editar Recurso</h2>
                            <p className="text-xs text-gray-500 font-bold">Modifica los detalles del archivo</p>
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
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {status && (
                        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200 ${
                            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                            <div className={`size-2 rounded-full ${status.type === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            {status.message}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700">Título del Material *</Label>
                        <Input 
                            value={formData.titulo}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                            className="h-12 rounded-2xl font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700">Descripción / Comentarios</Label>
                        <Textarea 
                            value={formData.descripcion}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                            className="rounded-2xl font-bold min-h-[100px]"
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700">Visibilidad</Label>
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio"
                                    checked={formData.visible === '1'}
                                    onChange={() => setFormData(prev => ({ ...prev, visible: '1' }))}
                                    className="size-4 text-blue-600"
                                />
                                <span className="text-sm font-bold text-gray-700">Visible</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio"
                                    checked={formData.visible === '0'}
                                    onChange={() => setFormData(prev => ({ ...prev, visible: '0' }))}
                                    className="size-4 text-blue-600"
                                />
                                <span className="text-sm font-bold text-gray-700">Oculto</span>
                            </label>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                    <Button 
                        type="button"
                        variant="outline" 
                        onClick={onClose}
                        className="h-12 px-6 rounded-2xl font-bold"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        disabled={loading || !formData.titulo}
                        className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold gap-2"
                    >
                        <Save size={16} />
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
