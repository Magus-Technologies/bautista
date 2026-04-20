// ── Tipos de formulario de matrícula ──────────────────────────────────────────

export type AlumnoForm = {
    estu_id:             number | null;
    username:            string;   // DNI
    email:               string;
    primer_nombre:       string;
    segundo_nombre:      string;
    apellido_paterno:    string;
    apellido_materno:    string;
    genero:              string;
    fecha_nacimiento:    string;
    edad:                string;
    talla:               string;
    peso:                string;
    telefono:            string;
    direccion:           string;
    colegio:             string;
    neurodivergencia:    string;
    terapia_ocupacional: string;
    seguro:              string;
    seguro_privado:      string;
    mensualidad:         string;
    fecha_ingreso:       string;
    fecha_pago:          string;
    dia_pago:            number | null;
    foto:                File | null;
};

export type ContactoForm = {
    nombres:        string;
    apellidos:      string;
    email_contacto: string;
    tipo_doc:       string;
    numero_doc:     string;
    telefono_1:     string;
    telefono_2:     string;
    estado_civil:   string;  // Juntos | Separados
    direccion:      string;
    departamento:   string;
    provincia:      string;
    distrito:       string;
    es_pagador:     boolean;
};

export const defaultAlumno = (): AlumnoForm => ({
    estu_id: null, username: '', email: '', primer_nombre: '', segundo_nombre: '',
    apellido_paterno: '', apellido_materno: '', genero: '', fecha_nacimiento: '',
    edad: '', talla: '', peso: '', telefono: '', direccion: '', colegio: '',
    neurodivergencia: '', terapia_ocupacional: '', seguro: '', seguro_privado: '',
    mensualidad: '', fecha_ingreso: '', fecha_pago: '', dia_pago: null, foto: null,
});

export const defaultContacto = (): ContactoForm => ({
    nombres: '', apellidos: '', email_contacto: '', tipo_doc: '1', numero_doc: '',
    telefono_1: '', telefono_2: '', estado_civil: '', direccion: '',
    departamento: '', provincia: '', distrito: '', es_pagador: false,
});

/** Mapea un contacto API -> ContactoForm */
 
export const mapContacto = (c: any): ContactoForm => ({
    nombres:        c.nombres        ?? '',
    apellidos:      c.apellidos      ?? '',
    email_contacto: c.email_contacto ?? '',
    tipo_doc:       c.tipo_doc?.toString() ?? '1',
    numero_doc:     c.numero_doc     ?? '',
    telefono_1:     c.telefono_1     ?? '',
    telefono_2:     c.telefono_2     ?? '',
    estado_civil:   c.estado_civil   ?? '',
    direccion:      c.direccion      ?? '',
    departamento:   c.departamento   ?? '',
    provincia:      c.provincia      ?? '',
    distrito:       c.distrito       ?? '',
    es_pagador:     c.es_pagador === 'si',
});
