<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocenteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'username'         => ['required', 'string', 'max:20', 'unique:users,username'],
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
        ];
    }

    public function attributes(): array
    {
        return [
            'username'         => 'DNI',
            'primer_nombre'    => 'primer nombre',
            'apellido_paterno' => 'apellido paterno',
        ];
    }
}
