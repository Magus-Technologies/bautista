import { useEffect, useRef, useState } from 'react';
import type { Institucion, InstitucionFormData } from './useInstitucion';
import { defaultForm } from './useInstitucion';

type Props = {
    editing:     Institucion | null;
    open:        boolean;
    onSave:      (data: FormData) => Promise<void>;
    onClose:     () => void;
    clearErrors: () => void;
};

export function useInstitucionForm({ editing, open, onSave, onClose, clearErrors }: Props) {
    const [form, setForm]               = useState<InstitucionFormData>(defaultForm);
    const [logoFile, setLogoFile]       = useState<File | null>(null);
    const [pemFile, setPemFile]         = useState<File | null>(null);
    const [processing, setProc]         = useState(false);
    const fileInputRef                  = useRef<HTMLInputElement>(null);
    const pemInputRef                   = useRef<HTMLInputElement>(null);

    useEffect(() => {
        clearErrors();
        setLogoFile(null);
        setPemFile(null);

        if (fileInputRef.current) fileInputRef.current.value = '';
        if (pemInputRef.current)  pemInputRef.current.value  = '';

        setForm(editing
            ? {
                insti_ruc:            editing.insti_ruc            ?? '',
                insti_razon_social:   editing.insti_razon_social   ?? '',
                insti_direccion:      editing.insti_direccion      ?? '',
                insti_telefono1:      editing.insti_telefono1      ?? '',
                insti_telefono2:      editing.insti_telefono2      ?? '',
                insti_email:          editing.insti_email          ?? '',
                insti_director:       editing.insti_director       ?? '',
                insti_ndni:           editing.insti_ndni           ?? '',
                insti_sunat_usuario:  editing.insti_sunat_usuario  ?? '',
                insti_sunat_clave:    editing.insti_sunat_clave    ?? '',
                insti_sunat_endpoint: editing.insti_sunat_endpoint ?? 'beta',
            }
            : defaultForm,
        );
    }, [editing, open]);

    const set = (key: keyof InstitucionFormData, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        setProc(true);

        try {
            const fd = new FormData();
            (Object.keys(form) as (keyof InstitucionFormData)[]).forEach((k) => {
                fd.append(k, form[k]);
            });

            if (logoFile) fd.append('logo', logoFile);
            if (pemFile)  fd.append('certificado', pemFile);

            await onSave(fd);
            onClose();
        } catch {
            // apiErrors manejados por useResource
        } finally {
            setProc(false);
        }
    };

    return { form, set, logoFile, setLogoFile, pemFile, setPemFile, pemInputRef, fileInputRef, processing, handleSubmit };
}
