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
            'tipo_usuario' => 'required|in:E,T',
            'rol_id' => 'nullable|exists:roles,id',
            'turno' => 'required|in:M,T,N',
            'hora_ingreso' => 'required|date_format:H:i',
            'hora_salida' => 'required|date_format:H:i|after:hora_ingreso',
            'minutos_tolerancia' => 'required|integer|min:0|max:60',
        ];
    }

    public function messages(): array
    {
        return [
            'nivel_id.exists' => 'El nivel educativo seleccionado no existe',
            'tipo_usuario.required' => 'El tipo de usuario es obligatorio',
            'tipo_usuario.in' => 'El tipo de usuario debe ser E (Estudiante) o T (Trabajador)',
            'rol_id.exists' => 'El rol seleccionado no existe',
            'turno.required' => 'El turno es obligatorio',
            'turno.in' => 'El turno debe ser M (Mañana), T (Tarde) o N (Noche)',
            'hora_ingreso.required' => 'La hora de ingreso es obligatoria',
            'hora_ingreso.date_format' => 'La hora de ingreso debe tener formato HH:MM',
            'hora_salida.required' => 'La hora de salida es obligatoria',
            'hora_salida.date_format' => 'La hora de salida debe tener formato HH:MM',
            'hora_salida.after' => 'La hora de salida debe ser posterior a la hora de ingreso',
            'minutos_tolerancia.required' => 'Los minutos de tolerancia son obligatorios',
            'minutos_tolerancia.integer' => 'Los minutos de tolerancia deben ser un número entero',
            'minutos_tolerancia.min' => 'Los minutos de tolerancia no pueden ser negativos',
            'minutos_tolerancia.max' => 'Los minutos de tolerancia no pueden exceder 60 minutos',
        ];
    }
}
