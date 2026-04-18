import { useEffect, useState } from 'react';
import type { Docente, DocenteFormData } from './useDocentes';
import { defaultForm } from './useDocentes';

type Props = {
    editing:     Docente | null;
    open:        boolean;
    onSave:      (data: DocenteFormData) => Promise<void>;
    onClose:     () => void;
    clearErrors: () => void;
};

export function useDocenteForm({ editing, open, onSave, onClose, clearErrors }: Props) {
    const [form, setForm]       = useState<DocenteFormData>(defaultForm);
    const [processing, setProc] = useState(false);

    useEffect(() => {
        clearErrors();

        if (editing) {
            setForm({
                username:         editing.user?.username           ?? '',
                email:            editing.user?.email              ?? '',
                primer_nombre:    editing.perfil?.primer_nombre    ?? '',
                segundo_nombre:   '',
                apellido_paterno: editing.perfil?.apellido_paterno ?? '',
                apellido_materno: editing.perfil?.apellido_materno ?? '',
                genero:           editing.perfil?.genero           ?? '',
                fecha_nacimiento: '',
                direccion:        '',
                telefono:         editing.perfil?.telefono         ?? '',
                especialidad:     editing.especialidad             ?? '',
                planilla:         editing.planilla.toString(),
                turno:            (editing.turno                  ?? '') as 'M' | 'T' | 'N' | '',
                estado:           editing.estado,
            });
        } else {
            setForm(defaultForm);
        }
    }, [editing, open]);

    const set = (key: keyof DocenteFormData, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProc(true);

        try {
            await onSave(form);
            onClose();
        } catch {
            // apiErrors manejados por useResource
        } finally {
            setProc(false);
        }
    };

    return { form, set, processing, handleSubmit };
}
