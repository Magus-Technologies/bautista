<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocenteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'username'         => ['required', 'string', 'max:20', Rule::unique('users', 'username')->ignore(
                \App\Models\Docente::find($this->route('docente'))?->id_usuario
            )],
            'email'            => ['nullable', 'email', 'max:100'],
            'primer_nombre'    => ['required', 'string', 'max:100'],
            'segundo_nombre'   => ['nullable', 'string', 'max:100'],
            'apellido_paterno' => ['required', 'string', 'max:100'],
            'apellido_materno' => ['nullable', 'string', 'max:100'],
            'genero'           => ['nullable', 'in:M,F'],
            'fecha_nacimiento' => ['nullable', 'date'],
            'direccion'        => ['nullable', 'string', 'max:200'],
            'telefono'         => ['nullable', 'string', 'max:20'],
            'especialidad'     => ['nullable', 'string', 'max:200'],
            'planilla'         => ['nullable', 'in:0,1'],
            'turno'            => ['nullable', 'in:M,T,N'],
            'estado'           => ['nullable', 'in:1,0,5'],
        ];
    }
}
