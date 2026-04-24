<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInstitucionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'insti_ruc'               => ['nullable', 'string', 'max:20'],
            'insti_razon_social'      => ['required', 'string', 'max:100'],
            'insti_direccion'         => ['nullable', 'string', 'max:200'],
            'insti_telefono1'         => ['nullable', 'string', 'max:20'],
            'insti_telefono2'         => ['nullable', 'string', 'max:20'],
            'insti_email'             => ['nullable', 'email', 'max:100'],
            'insti_director'          => ['nullable', 'string', 'max:100'],
            'insti_ndni'              => ['nullable', 'string', 'max:20'],
            'logo'                    => ['nullable', 'image', 'max:5120'],
            'insti_sunat_usuario'     => ['nullable', 'string', 'max:50'],
            'insti_sunat_clave'       => ['nullable', 'string', 'max:100'],
            'insti_sunat_endpoint'    => ['nullable', 'in:beta,production'],
            'certificado'             => ['nullable', 'file', 'max:512'],
        ];
    }
}
