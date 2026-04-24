import type { Paginated } from '@/components/shared/ResourceTable';

export type Institucion = {
    insti_id:                   number;
    insti_ruc:                  string | null;
    insti_razon_social:         string | null;
    insti_direccion:            string | null;
    insti_telefono1:            string | null;
    insti_telefono2:            string | null;
    insti_email:                string | null;
    insti_director:             string | null;
    insti_ndni:                 string | null;
    insti_logo:                 string | null;
    insti_estatus:              number;
    insti_sunat_usuario:        string | null;
    insti_sunat_clave:          string | null;
    insti_sunat_endpoint:       string | null;
    insti_certificado_enviado:  boolean;
};

export type PaginatedInstituciones = Paginated<Institucion>;

export type InstitucionFormData = {
    insti_ruc:               string;
    insti_razon_social:      string;
    insti_direccion:         string;
    insti_telefono1:         string;
    insti_telefono2:         string;
    insti_email:             string;
    insti_director:          string;
    insti_ndni:              string;
    insti_sunat_usuario:     string;
    insti_sunat_clave:       string;
    insti_sunat_endpoint:    string;
};

export const defaultForm: InstitucionFormData = {
    insti_ruc:               '',
    insti_razon_social:      '',
    insti_direccion:         '',
    insti_telefono1:         '',
    insti_telefono2:         '',
    insti_email:             '',
    insti_director:          '',
    insti_ndni:              '',
    insti_sunat_usuario:     '',
    insti_sunat_clave:       '',
    insti_sunat_endpoint:    'beta',
};
