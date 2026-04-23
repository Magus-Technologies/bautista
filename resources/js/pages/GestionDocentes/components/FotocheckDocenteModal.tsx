import { Download, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FotocheckCardPreview from '@/pages/Shared/components/FotocheckCardPreview';
import api from '@/lib/api';
import type { Docente } from '../hooks/useDocentes';

let cachedConfig: any = null;

interface Props {
    open: boolean;
    onClose: () => void;
    docente: Docente | null;
}

export default function FotocheckDocenteModal({ open, onClose, docente }: Props) {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            if (cachedConfig) {
                setConfig(cachedConfig);
                setLoading(false);
                return;
            }

            setLoading(true);
            api.get('/configuracion-fotocheck')
                .then(res => {
                    cachedConfig = res.data;
                    setConfig(res.data);
                })
                .catch(err => console.error("Error loading config:", err))
                .finally(() => setLoading(false));
        }
    }, [open]);

    if (!docente) return null;

    const fotocheckUrl = `/docentes/${docente.docente_id}/fotocheck`;

    const handleDownload = () => {
        window.open(fotocheckUrl, '_blank');
    };

    const getPreviewData = () => {
        const pNombre = docente.perfil?.primer_nombre || '';
        const sNombre = docente.perfil?.segundo_nombre || '';
        const pApellido = docente.perfil?.apellido_paterno || '';
        const sApellido = docente.perfil?.apellido_materno || '';
        
        const fullName = `${pNombre} ${sNombre} ${pApellido} ${sApellido}`.trim();

        return {
            id: docente.docente_id,
            name: fullName || 'SIN NOMBRE',
            rol_name: 'DOCENTE',
            isDocente: true,
            avatar: docente.perfil?.foto_perfil ? `/storage/${docente.perfil.foto_perfil}` : undefined,
            details: {
                student_id: `DOC-${docente.docente_id.toString().padStart(6, '0')}`,
                dni: docente.perfil?.doc_numero || undefined,
                especialidad: docente.especialidad || undefined,
                tel: docente.perfil?.telefono || undefined,
            }
        };
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-[#f8fafc] rounded-[2rem]">
                <DialogHeader className="px-8 py-6 bg-white border-b flex flex-row items-center justify-between space-y-0">
                    <div>
                        <DialogTitle className="text-xl font-black text-neutral-900 uppercase tracking-tight">
                            Fotocheck Institucional
                        </DialogTitle>
                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Vista Previa Digital</p>
                    </div>
                </DialogHeader>

                <div className="flex flex-col items-center justify-start p-6 min-h-[580px] overflow-visible">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                            <Loader2 className="size-8 text-emerald-500 animate-spin" />
                            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Generando Diseño...</p>
                        </div>
                    ) : (
                        <div className="mt-8 flex justify-center w-full">
                            <FotocheckCardPreview 
                                user={getPreviewData()} 
                                config={config} 
                                className="scale-[1.4] sm:scale-[1.5] transform origin-top"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="px-8 py-6 bg-white border-t flex flex-row items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 hidden sm:block">
                        <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em] mb-1">
                            Docente Seleccionado
                        </p>
                        <p className="text-sm text-neutral-900 truncate font-black uppercase">
                            {getPreviewData().name}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl font-bold text-neutral-400 hover:text-neutral-600 px-6"
                        >
                            Cerrar
                        </Button>
                        <Button 
                            onClick={handleDownload}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl px-8 h-12 shadow-lg shadow-emerald-200 transition-all active:scale-95 font-black uppercase text-[10px] tracking-widest"
                        >
                            <Download className="h-4 w-4" />
                            Imprimir PDF
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
