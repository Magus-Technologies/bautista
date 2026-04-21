import { useEffect, useState } from 'react';
import type { Grado, GradoFormData } from './useGrados';
import { defaultForm } from './useGrados';

type Props = {
    editing: Grado | null;
    open: boolean;
    defaultNivelId?: string;
    onSave: (data: GradoFormData) => Promise<void>;
    onClose: () => void;
    clearErrors: () => void;
};

export function useGradoForm({ editing, open, onSave, onClose, clearErrors, defaultNivelId }: Props) {
    const [form, setForm] = useState<GradoFormData>(defaultForm);
    const [processing, setProc] = useState(false);

    useEffect(() => {
        clearErrors();
        if (editing) {
            setForm({
                nivel_id: editing.nivel_id.toString(),
                nombre_grado: editing.nombre_grado,
                abreviatura: editing.abreviatura ?? '',
            });
        } else {
            setForm({
                ...defaultForm,
                nivel_id: defaultNivelId ?? '',
            });
        }
    }, [editing, open, defaultNivelId]);

    const set = (key: keyof GradoFormData, value: string) =>
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
