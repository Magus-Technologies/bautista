<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRhContratoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('rh.contratos.editar');
    }

    public function rules(): array
    {
        return [
            'tipo_contrato' => 'sometimes|in:tiempo_completo,medio_tiempo,por_horas,practicante',
            'sueldo_base' => 'sometimes|numeric|min:0',
            'bonificaciones' => 'nullable|numeric|min:0',
            'horas_semanales' => 'sometimes|integer|min:1|max:168',
            'descuento_por_tardanza' => 'sometimes|numeric|min:0',
            'tipo_descuento' => 'sometimes|in:fijo,porcentaje,proporcional',
            'fecha_inicio' => 'sometimes|date',
            'fecha_fin' => 'nullable|date|after:fecha_inicio',
            'estado' => 'sometimes|in:activo,suspendido,finalizado',
            'observaciones' => 'nullable|string|max:1000',
        ];
    }
}
