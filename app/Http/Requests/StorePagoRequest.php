<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePagoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $mesesValidos = 'ENERO,FEBRERO,MARZO,ABRIL,MAYO,JUNIO,JULIO,AGOSTO,SEPTIEMBRE,OCTUBRE,NOVIEMBRE,DICIEMBRE';

        return [
            'contacto_id'  => ['required', 'integer', 'exists:padre_apoderado,id_contacto'],
            'estudiante_id'=> ['required', 'integer', 'exists:estudiantes,estu_id'],
            'concepto_id'  => ['nullable', 'integer', 'exists:concepto_pago,concepto_id'],
            'pag_anual'    => ['required', 'integer', 'min:2000', 'max:2100'],
            'pag_mes'      => ['nullable', 'string', "in:{$mesesValidos}"],
            'pag_monto'    => ['required', 'numeric', 'min:0'],
            // Legacy — aceptados pero no requeridos
            'pag_nombre1'  => ['nullable', 'string', 'max:50'],
            'pag_otro1'    => ['nullable', 'numeric', 'min:0'],
            'pag_nombre2'  => ['nullable', 'string', 'max:50'],
            'pag_otro2'    => ['nullable', 'numeric', 'min:0'],
            'pag_notifica' => ['nullable', 'in:SI,NO'],
            'pag_fecha'    => ['nullable', 'date'],
        ];
    }
}
