import { Download, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FotocheckCardPreview from './FotocheckCardPreview';
import api from '@/lib/api';

// Cache simple para evitar peticiones repetitivas en la misma sesión
let cachedConfig: any = null;

// Tipos mínimos necesarios para que funcione en ambos contextos
interface MinimalEstudiante {
    estu_id: number;
    user_id?: number | null;
    nombre_completo?: string;
    avatar?: string | null;
    telefono?: string | null;
    doc_numero?: string | null;
    primer_nombre?: string | null;
    apellido_paterno?: string | null;
    perfil?: {
        primer_nombre?: string | null;
        apellido_paterno?: string | null;
        doc_numero?: string | null;
        avatar?: string | null;
        telefono?: string | null;
    } | null;
}

interface MinimalMatricula {
    estu_id: number;
    estudiante?: MinimalEstudiante | null;
    seccion?: {
        nombre: string;
        grado?: {
            nombre_grado: string;
            nivel?: {
                nombre_nivel: string;
            } | null;
        } | null;
    } | null;
}

interface Props {
    open: boolean;
    onClose: () => void;
    // Puede venir de Matricula o directamente de Estudiante
    matricula?: MinimalMatricula | null;
    estudiante?: MinimalEstudiante | null;
}

export default function FotocheckModal({ open, onClose, matricula, estudiante }: Props) {
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

    const activeEstudiante = estudiante || matricula?.estudiante;
    const estuId = estudiante?.estu_id || matricula?.estu_id;

    if (!estuId) return null;

    const fotocheckUrl = `/estudiantes/${estuId}/fotocheck`;

    const handleDownload = () => {
        window.open(fotocheckUrl, '_blank');
    };

    // Mapear datos al formato del preview global
    const getPreviewData = () => {
        const student = activeEstudiante;
        const seccion = matricula?.seccion;
        
        const pNombre = student?.primer_nombre || student?.perfil?.primer_nombre || '';
        const pApellido = student?.apellido_paterno || student?.perfil?.apellido_paterno || '';
        const builtName = (pNombre + ' ' + pApellido).trim();
        const finalName = builtName || student?.nombre_completo || 'SIN NOMBRE';

        return {
            id: estuId,  // estu_id correcto para el ID del fotocheck
            name: finalName,
            rol_name: 'ALUMNO(A)',
            avatar: student?.avatar || student?.perfil?.avatar || undefined,
            details: {
                student_id: `EST-${estuId.toString().padStart(6, '0')}`,
                dni: student?.doc_numero || student?.perfil?.doc_numero || undefined,
                nivel: seccion?.grado?.nivel?.nombre_nivel || undefined,
                grado: seccion?.grado?.nombre_grado || undefined,
                seccion: seccion?.nombre || undefined,
                tel: student?.telefono || student?.perfil?.telefono || undefined,
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
                            Estudiante Seleccionado
                        </p>
                        <p className="text-sm text-neutral-900 truncate font-black uppercase">
                            {activeEstudiante?.nombre_completo || activeEstudiante?.perfil?.primer_nombre || 'Alumno'}
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
