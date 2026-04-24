<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotaDebitoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'comprobante_referencia_id' => ['required', 'integer', 'exists:comprobantes,id'],
            'tipo_nota' => ['required', 'string', 'in:01,02,03'],
            'motivo_nota' => ['required', 'string', 'max:500'],
            'total' => ['required', 'numeric', 'min:0.01'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.cod_producto' => ['required', 'string', 'max:50'],
            'items.*.descripcion' => ['required', 'string', 'max:500'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
            'items.*.precio' => ['required', 'numeric', 'min:0.01'],
        ];
    }

    public function messages(): array
    {
        return [
            'comprobante_referencia_id.required' => 'Debe seleccionar el comprobante a modificar.',
            'comprobante_referencia_id.exists' => 'El comprobante seleccionado no existe.',
            'tipo_nota.required' => 'Debe seleccionar el tipo de nota de débito.',
            'tipo_nota.in' => 'El tipo de nota seleccionado no es válido.',
            'motivo_nota.required' => 'Debe ingresar el motivo de la nota de débito.',
            'motivo_nota.max' => 'El motivo no puede exceder 500 caracteres.',
            'total.required' => 'Debe ingresar el monto total.',
            'total.min' => 'El monto debe ser mayor a 0.',
            'items.required' => 'Debe agregar al menos un ítem.',
            'items.min' => 'Debe agregar al menos un ítem.',
        ];
    }
}
