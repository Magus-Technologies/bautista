import { useState } from 'react';
import type { Horario, HorarioFormData } from './useHorarios';

export function useHorarioForm(activeTab: 'E' | 'T') {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Horario | null>(null);
    const [form, setForm] = useState<HorarioFormData>({
        nivel_id: '',
        tipo_usuario: activeTab,
        rol_id: '',
        turno: 'M',
        hora_ingreso: '',
        hora_salida: '',
        minutos_tolerancia: '15',
    });

    const openCreate = () => {
        setEditing(null);
        setForm({
            nivel_id: '',
            tipo_usuario: activeTab,
            rol_id: '',
            turno: 'M',
            hora_ingreso: '',
            hora_salida: '',
            minutos_tolerancia: '15',
        });
        setOpen(true);
    };

    const openEdit = (h: Horario) => {
        setEditing(h);
        setForm({
            nivel_id: h.nivel_id?.toString() || '',
            tipo_usuario: h.tipo_usuario,
            rol_id: h.rol_id?.toString() || '',
            turno: h.turno,
            hora_ingreso: h.hora_ingreso.substring(0, 5),
            hora_salida: h.hora_salida.substring(0, 5),
            minutos_tolerancia: h.minutos_tolerancia?.toString() || '15',
        });
        setOpen(true);
    };

    const closeModal = () => setOpen(false);

    return {
        open,
        editing,
        form,
        setForm,
        openCreate,
        openEdit,
        closeModal,
    };
}
