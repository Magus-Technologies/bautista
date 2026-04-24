export type EstudiantePagador = {
    estu_id:         number;
    nombre_completo: string;
    mensualidad:     string;
};

export type Pagador = {
    id_usuario:  number;
    nombres:     string;
    apellidos:   string;
    telefono_1:  string | null;
    numero_doc:  string | null;
    mensualidad: string | null;
    estu_id:     number;
    id_contacto: number;
    pagos_count: number;
};

export type Pago = {
    pag_id:          number;
    contacto_id:     number;
    estu_id:         number;
    // legacy — puede venir en registros anteriores
    estudiante_id?:  number;
    // nuevo modelo
    concepto_id:     number | null;
    concepto_nombre: string | null;
    periodicidad:    'mensual' | 'anual' | 'unico' | null;
    pag_anual:       number;
    pag_mes:         string | null;
    pag_monto:       string;
    // legacy — se mantienen para compatibilidad
    pag_nombre1:     string | null;
    pag_otro1:       string | null;
    pag_nombre2:     string | null;
    pag_otro2:       string | null;
    total:           string;
    pag_notifica:    'SI' | 'NO';
    pag_fecha:       string | null;
    estatus:         0 | 1;
    comprobante_id:  number | null;
    observacion:     string | null;
};

export type PagoFormData = {
    contacto_id:   string;
    estudiante_id: string;
    concepto_id:   string;   // nuevo — ID del concepto seleccionado
    pag_anual:     string;
    pag_mes:       string;   // vacío para conceptos único/anual
    pag_monto:     string;
    pag_notifica:  string;
    pag_fecha:     string;
    // legacy — se mantienen para no romper datos existentes
    pag_nombre1:   string;
    pag_otro1:     string;
    pag_nombre2:   string;
    pag_otro2:     string;
};

export type PagoUpdateData = {
    concepto_id:  string | null;
    pag_monto:    string;
    pag_notifica: string;
    pag_fecha:    string;
    // legacy
    pag_nombre1:  string;
    pag_otro1:    string;
    pag_nombre2:  string;
    pag_otro2:    string;
};

export const MESES = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
] as const;

export const defaultPagoForm = (
    contactoId: number,
    estudianteId: number,
): PagoFormData => ({
    contacto_id:   contactoId.toString(),
    estudiante_id: estudianteId.toString(),
    concepto_id:   '',
    pag_anual:     new Date().getFullYear().toString(),
    pag_mes:       MESES[new Date().getMonth()],
    pag_monto:     '',
    pag_notifica:  'NO',
    pag_fecha:     new Date().toISOString().slice(0, 10),
    pag_nombre1:   '',
    pag_otro1:     '',
    pag_nombre2:   '',
    pag_otro2:     '',
});

export const defaultPagoUpdateForm = (pago: Pago): PagoUpdateData => ({
    concepto_id:  pago.concepto_id?.toString() ?? null,
    pag_monto:    pago.pag_monto,
    pag_notifica: pago.pag_notifica,
    pag_fecha:    pago.pag_fecha ?? '',
    pag_nombre1:  pago.pag_nombre1 ?? '',
    pag_otro1:    pago.pag_otro1 ?? '',
    pag_nombre2:  pago.pag_nombre2 ?? '',
    pag_otro2:    pago.pag_otro2 ?? '',
});
