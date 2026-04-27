<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRhContratoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('rh.contratos.crear');
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'tipo_contrato' => 'required|in:tiempo_completo,medio_tiempo,por_horas,practicante',
            'sueldo_base' => 'required|numeric|min:0',
            'bonificaciones' => 'nullable|numeric|min:0',
            'horas_semanales' => 'required|integer|min:1|max:168',
            'descuento_por_tardanza' => 'required|numeric|min:0',
            'tipo_descuento' => 'required|in:fijo,porcentaje,proporcional',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after:fecha_inicio',
            'estado' => 'nullable|in:activo,suspendido,finalizado',
            'observaciones' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'El usuario es requerido',
            'user_id.exists' => 'El usuario no existe',
            'tipo_contrato.required' => 'El tipo de contrato es requerido',
            'sueldo_base.required' => 'El sueldo base es requerido',
            'sueldo_base.min' => 'El sueldo base debe ser mayor a 0',
            'horas_semanales.required' => 'Las horas semanales son requeridas',
            'descuento_por_tardanza.required' => 'El descuento por tardanza es requerido',
            'fecha_inicio.required' => 'La fecha de inicio es requerida',
            'fecha_fin.after' => 'La fecha de fin debe ser posterior a la fecha de inicio',
        ];
    }
}
