import type { Paginated } from '@/components/shared/ResourceTable';

export type Perfil = {
    primer_nombre:    string;
    apellido_paterno: string;
    apellido_materno: string | null;
    genero:           'M' | 'F' | null;
    doc_numero:       string | null;
    telefono:         string | null;
};

export type UserAuth = {
    id:       number;
    username: string;
    email:    string | null;
};

export type Docente = {
    docente_id:  number;
    especialidad: string | null;
    planilla:     number;
    turno:        'M' | 'T' | 'N' | null;
    estado:       '1' | '0' | '5';
    perfil:       Perfil | null;
    user:         UserAuth | null;
};

export type PaginatedDocentes = Paginated<Docente>;

export type DocenteFormData = {
    username:         string;
    email:            string;
    primer_nombre:    string;
    segundo_nombre:   string;
    apellido_paterno: string;
    apellido_materno: string;
    genero:           'M' | 'F' | '';
    fecha_nacimiento: string;
    direccion:        string;
    telefono:         string;
    especialidad:     string;
    planilla:         string;
    turno:            'M' | 'T' | 'N' | '';
    estado?:          string;
};

export const defaultForm: DocenteFormData = {
    username:         '',
    email:            '',
    primer_nombre:    '',
    segundo_nombre:   '',
    apellido_paterno: '',
    apellido_materno: '',
    genero:           '' as 'M' | 'F' | '',
    fecha_nacimiento: '',
    direccion:        '',
    telefono:         '',
    especialidad:     '',
    planilla:         '1',
    turno:            '',
};

export function nombreCompleto(d: Docente): string {
    if (d.perfil) {
        return [d.perfil.primer_nombre, d.perfil.apellido_paterno, d.perfil.apellido_materno]
            .filter(Boolean).join(' ');
    }

    return d.user?.username ?? '—';
}

export function dniDocente(d: Docente): string {
    return d.perfil?.doc_numero ?? d.user?.username ?? '—';
}
