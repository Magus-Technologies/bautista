import { useState, useEffect } from 'react';
import { useResource } from '@/hooks/useResource';
import axios from 'axios';

export type Horario = {
    horario_id: number;
    insti_id: number;
    nivel_id: number | null;
    tipo_usuario: 'E' | 'T';
    rol_id: number | null;
    turno: 'M' | 'T' | 'N';
    hora_ingreso: string;
    hora_salida: string;
    minutos_tolerancia: number;
    nivel?: {
        nivel_id: number;
        nombre_nivel: string;
    };
    rol?: {
        id: number;
        name: string;
    };
};

export type Nivel = {
    nivel_id: number;
    nombre_nivel: string;
};

export type RolTrabajador = {
    id: number;
    name: string;
    es_trabajador: boolean;
};

export type HorarioFormData = {
    nivel_id: string;
    tipo_usuario: 'E' | 'T';
    rol_id: string;
    turno: 'M' | 'T' | 'N';
    hora_ingreso: string;
    hora_salida: string;
    minutos_tolerancia: string;
};

export function useHorarios(activeTab: 'E' | 'T') {
    const [niveles, setNiveles] = useState<Nivel[]>([]);
    const [rolesTrabajadores, setRolesTrabajadores] = useState<RolTrabajador[]>([]);
    
    const resEstudiante = useResource<Horario>('/horarios-asistencia', { tipo_usuario: 'E' });
    const resTrabajador = useResource<Horario>('/horarios-asistencia', { tipo_usuario: 'T' });
    const res = activeTab === 'E' ? resEstudiante : resTrabajador;

    useEffect(() => {
        axios.get('/api/niveles').then(r => {
            const data = r.data.data || r.data;
            setNiveles(Array.isArray(data) ? data : []);
        }).catch(() => setNiveles([]));

        axios.get('/api/seguridad/roles/trabajadores').then(r => {
            setRolesTrabajadores(r.data || []);
        }).catch(() => setRolesTrabajadores([]));
    }, []);

    return {
        res,
        resEstudiante,
        resTrabajador,
        niveles,
        rolesTrabajadores,
    };
}
