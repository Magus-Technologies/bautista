import { UserPlus, Trash2, Lock, Unlock, FileText, History } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOptions } from '@/hooks/useOptions';
import api from '@/lib/api';
import type { Matricula, MatriculaApertura, EstudianteDisponible, SeccionOption, GradoOption, MatriculaFormData } from '../hooks/useMatricula';
import MatricularModal from './MatricularModal';

type Props = {
    open:        boolean;
    onClose:     () => void;
    apertura:    MatriculaApertura | null;
    secciones:   SeccionOption[];
    nivelId?:    number | null;
    nivelNombre?: string | null;
};

export default function MatriculasDrawer({ open, onClose, apertura, secciones, nivelId, nivelNombre }: Props) {
    const grados = useOptions<GradoOption>('/grados');
    const [matriculas, setMatriculas]   = useState<Matricula[]>([]);
    const [disponibles, setDisponibles] = useState<EstudianteDisponible[]>([]);
    const [loading, setLoading]         = useState(false);
    const [modalOpen, setModalOpen]     = useState(false);
    const [apiErrors, setApiErrors]     = useState<Record<string, string[]>>({});
    const [toggling, setToggling]       = useState<number | null>(null);
    const [deletingId, setDeletingId]   = useState<number | null>(null);

    const cargar = useCallback(async () => {
        if (!apertura) {
return;
}

        setLoading(true);

        try {
            const params: Record<string, unknown> = { per_page: 200 };

            if (nivelId) {
params.nivel_id = nivelId;
}

            const [matRes, dispRes] = await Promise.all([
                api.get(`/matriculas/aperturas/${apertura.apertura_id}/estudiantes`, { params }),
                api.get(`/matriculas/aperturas/${apertura.apertura_id}/disponibles`),
            ]);
            setMatriculas(matRes.data.data ?? []);
            setDisponibles(dispRes.data);
        } finally {
            setLoading(false);
        }
    }, [apertura, nivelId]);

    useEffect(() => {
        if (open && apertura) {
cargar();
}
    }, [open, apertura, cargar]);

    const handleMatricular = async (data: MatriculaFormData) => {
        setApiErrors({});
        await api.post('/matriculas', data);
        await cargar();
    };

    const handleAnular = async () => {
        if (!deletingId) {
return;
}

        setLoading(true);

        try {
            await api.delete(`/matriculas/${deletingId}`);
            setDeletingId(null);
            await cargar();
        } finally {
            setLoading(false);
        }
    };

    const deletingMatricula = matriculas.find(m => m.matricula_id === deletingId);
    const studentName = deletingMatricula?.estudiante 
        ? `${deletingMatricula.estudiante.primer_nombre} ${deletingMatricula.estudiante.apellido_paterno}`
        : 'este estudiante';


    const handleToggleBloqueo = async (m: Matricula) => {
        if (!m.estudiante?.user_id) {
return;
}

        setToggling(m.matricula_id);

        try {
            await api.patch(`/usuarios/${m.estudiante.user_id}/estado`);
            setMatriculas((prev) =>
                prev.map((item) =>
                    item.matricula_id === m.matricula_id && item.estudiante
                        ? {
                              ...item,
                              estudiante: {
                                  ...item.estudiante,
                                  estado_user: item.estudiante.estado_user === '5' ? '1' : '5',
                              },
                          }
                        : item,
                ),
            );
        } finally {
            setToggling(null);
        }
    };

    if (!apertura) {
return null;
}

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
                <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>
                                Matriculados — {nivelNombre ?? apertura.nombre}{' '}
                                <span className="text-sm font-normal text-gray-500">
                                    ({matriculas.length} estudiante{matriculas.length !== 1 ? 's' : ''})
                                </span>
                            </span>
                            <Button
                                size="sm"
                                className="bg-[#00a65a] hover:bg-[#008d4c] text-white"
                                onClick={() => setModalOpen(true)}
                                disabled={disponibles.length === 0}
                            >
                                <UserPlus className="mr-1 h-4 w-4" />
                                Matricular
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <p className="py-6 text-center text-sm text-gray-400">Cargando...</p>
                        ) : matriculas.length === 0 ? (
                            <p className="py-8 text-center text-sm text-gray-400">
                                No hay estudiantes matriculados aún.
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                                        <th className="px-2 py-2">#</th>
                                        <th className="px-2 py-2">Grado / Sección</th>
                                        <th className="px-2 py-2">Primer Nombre</th>
                                        <th className="px-2 py-2">Segundo Nombre</th>
                                        <th className="px-2 py-2">Ap. Paterno</th>
                                        <th className="px-2 py-2">Ap. Materno</th>
                                        <th className="px-2 py-2">DNI</th>
                                        <th className="px-2 py-2">Fecha Matr.</th>
                                        <th className="px-2 py-2 text-center">Bloqueado</th>
                                        <th className="px-2 py-2 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {matriculas.map((m, idx) => {
                                        const bloqueado = m.estudiante?.estado_user === '5';

                                        return (
                                            <tr
                                                key={m.matricula_id}
                                                className={`border-b hover:bg-gray-50 ${bloqueado ? 'bg-red-50' : ''}`}
                                            >
                                                <td className="px-2 py-2 text-gray-400">{idx + 1}</td>
                                                <td className="px-2 py-2">
                                                    {m.seccion ? (
                                                        <span>
                                                            {m.seccion.grado?.nombre_grado ?? '—'}{' '}
                                                            <span className="text-gray-500">{m.seccion.nombre}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="italic text-gray-400">Sin sección</span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-2">{m.estudiante?.primer_nombre ?? '—'}</td>
                                                <td className="px-2 py-2 text-gray-500">{m.estudiante?.segundo_nombre ?? '—'}</td>
                                                <td className="px-2 py-2 font-medium">{m.estudiante?.apellido_paterno ?? '—'}</td>
                                                <td className="px-2 py-2 text-gray-500">{m.estudiante?.apellido_materno ?? '—'}</td>
                                                <td className="px-2 py-2 text-gray-500">{m.estudiante?.doc_numero ?? '—'}</td>
                                                <td className="px-2 py-2 text-gray-500">{m.fecha_matricula ?? '—'}</td>
                                                <td className="px-2 py-2 text-center">
                                                    {m.estudiante?.user_id ? (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className={bloqueado ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                                                            onClick={() => handleToggleBloqueo(m)}
                                                            disabled={toggling === m.matricula_id}
                                                            title={bloqueado ? 'Desbloquear usuario' : 'Bloquear usuario'}
                                                        >
                                                            {bloqueado ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-2">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-blue-500 hover:text-blue-700"
                                                            title="Fotocheck"
                                                            onClick={() => alert('Fotocheck PDF — próximamente')}
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-purple-500 hover:text-purple-700"
                                                            title="Historial"
                                                            onClick={() => alert('Historial — próximamente')}
                                                        >
                                                            <History className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Anular matrícula"
                                                            onClick={() => setDeletingId(m.matricula_id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>

                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <MatricularModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                aperturaId={apertura.apertura_id}
                anio={apertura.anio}
                nivelId={nivelId}
                estudiantes={disponibles}
                grados={grados}
                secciones={secciones}
                onSave={handleMatricular}
                apiErrors={apiErrors}
                clearErrors={() => setApiErrors({})}
            />
            <ConfirmDeleteModal
                open={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={handleAnular}
                title="Anular Matrícula"
                message={`¿Estás seguro de que deseas anular la matrícula de ${studentName}? Esta acción eliminará el registro del periodo actual.`}
                processing={loading}
            />
        </>
    );
}

