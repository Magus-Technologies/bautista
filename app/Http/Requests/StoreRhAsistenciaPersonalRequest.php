<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRhAsistenciaPersonalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('rh.asistencia.crear');
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'contrato_id' => 'nullable|exists:rh_contratos,contrato_id',
            'fecha' => 'required|date',
            'hora_entrada' => 'nullable|date_format:H:i:s',
            'hora_salida' => 'nullable|date_format:H:i:s',
            'estado' => 'required|in:presente,ausente,tardanza,permiso,vacaciones,licencia',
            'minutos_tardanza' => 'nullable|integer|min:0',
            'descuento_aplicado' => 'nullable|numeric|min:0',
            'observaciones' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'El usuario es requerido',
            'user_id.exists' => 'El usuario no existe',
            'fecha.required' => 'La fecha es requerida',
            'estado.required' => 'El estado es requerido',
        ];
    }
}
