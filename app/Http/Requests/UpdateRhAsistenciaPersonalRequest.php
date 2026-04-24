<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRhAsistenciaPersonalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('rh.asistencia.editar');
    }

    public function rules(): array
    {
        return [
            'hora_entrada' => 'nullable|date_format:H:i:s',
            'hora_salida' => 'nullable|date_format:H:i:s',
            'estado' => 'sometimes|in:presente,ausente,tardanza,permiso,vacaciones,licencia',
            'minutos_tardanza' => 'nullable|integer|min:0',
            'descuento_aplicado' => 'nullable|numeric|min:0',
            'observaciones' => 'nullable|string|max:500',
        ];
    }
}
