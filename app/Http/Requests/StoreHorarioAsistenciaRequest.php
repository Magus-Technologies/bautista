<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreHorarioAsistenciaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nivel_id' => 'nullable|exists:niveles_educativos,nivel_id',
            'tipo_usuario' => 'required|in:E,D',
            'turno' => 'required|in:M,T,N',
            'hora_ingreso' => 'required|date_format:H:i',
            'hora_salida' => 'required|date_format:H:i|after:hora_ingreso',
        ];
    }

    public function messages(): array
    {
        return [
            'nivel_id.exists' => 'El nivel educativo seleccionado no existe',
            'tipo_usuario.required' => 'El tipo de usuario es obligatorio',
            'tipo_usuario.in' => 'El tipo de usuario debe ser E (Estudiante) o D (Docente)',
            'turno.required' => 'El turno es obligatorio',
            'turno.in' => 'El turno debe ser M (Mañana), T (Tarde) o N (Noche)',
            'hora_ingreso.required' => 'La hora de ingreso es obligatoria',
            'hora_ingreso.date_format' => 'La hora de ingreso debe tener formato HH:MM',
            'hora_salida.required' => 'La hora de salida es obligatoria',
            'hora_salida.date_format' => 'La hora de salida debe tener formato HH:MM',
            'hora_salida.after' => 'La hora de salida debe ser posterior a la hora de ingreso',
        ];
    }
}
