import type { Paginated } from '@/components/shared/ResourceTable';

export type UsuarioPerfil = {
    primer_nombre:    string;
    segundo_nombre:   string | null;
    apellido_paterno: string;
    apellido_materno: string | null;
    genero:           'M' | 'F' | null;
    tipo_doc:         number | null;
    doc_numero:       string | null;
    fecha_nacimiento: string | null;
    telefono:         string | null;
    direccion:        string | null;
};

export type Usuario = {
    id:       number;
    username: string;
    name:     string | null;
    email:    string | null;
    estado:   '1' | '0' | '5';
    rol:      string | null;
    es_trabajador: boolean;
    perfil:   UsuarioPerfil | null;
};

export type PaginatedUsuarios = Paginated<Usuario>;

export type UsuarioFormData = {
    username:         string;
    email:            string;
    primer_nombre:    string;
    segundo_nombre:   string;
    apellido_paterno: string;
    apellido_materno: string;
    genero:           'M' | 'F' | '';
    tipo_doc:         string;
    doc_numero:       string;
    fecha_nacimiento: string;
    telefono:         string;
    direccion:        string;
    rol:              string;
    estado?:          string;
};

export const TIPOS_DOC = [
    { value: '1', label: 'DNI' },
    { value: '2', label: 'Carnet de Extranjería' },
    { value: '3', label: 'Pasaporte' },
    { value: '4', label: 'RUC' },
];

export const defaultForm: UsuarioFormData = {
    username:         '',
    email:            '',
    primer_nombre:    '',
    segundo_nombre:   '',
    apellido_paterno: '',
    apellido_materno: '',
    genero:           '' as 'M' | 'F' | '',
    tipo_doc:         '1',
    doc_numero:       '',
    fecha_nacimiento: '',
    telefono:         '',
    direccion:        '',
    rol:              '',
};

export function nombreCompleto(u: Usuario): string {
    if (u.perfil) {
        return [u.perfil.primer_nombre, u.perfil.apellido_paterno, u.perfil.apellido_materno]
            .filter(Boolean).join(' ');
    }

    return u.name ?? u.username;
}

export function rolLabel(rol: string | null): string {
    if (!rol) return '—';
    return rol.replace('_', ' ').toUpperCase();
}
