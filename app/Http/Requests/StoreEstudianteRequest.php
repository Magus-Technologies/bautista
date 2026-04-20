<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEstudianteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation()
    {
        $data = $this->all();
        foreach ($data as $key => $value) {
            if ($value === 'null' || $value === 'undefined') {
                $data[$key] = null;
            }
        }
        $this->replace($data);
    }

    public function rules(): array
    {
        return [
            'username'            => ['required', 'string', 'max:20', 'unique:users,username'],
            'email'               => ['nullable', 'email', 'max:100'],
            'primer_nombre'       => ['required', 'string', 'max:100'],
            'segundo_nombre'      => ['nullable', 'string', 'max:100'],
            'apellido_paterno'    => ['required', 'string', 'max:100'],
            'apellido_materno'    => ['nullable', 'string', 'max:100'],
            'genero'              => ['nullable', 'string', 'max:15'],
            'fecha_nacimiento'    => ['nullable', 'date'],
            'direccion'           => ['nullable', 'string', 'max:200'],
            'telefono'            => ['nullable', 'string', 'max:20'],
            'colegio'             => ['nullable', 'string', 'max:255'],
            'neurodivergencia'    => ['nullable', 'string', 'max:255'],
            'terapia_ocupacional' => ['nullable', 'string', 'max:255'],
            'edad'                => ['nullable', 'integer', 'min:1', 'max:99'],
            'talla'               => ['nullable', 'string', 'max:50'],
            'peso'                => ['nullable', 'numeric', 'min:0'],
            'seguro'              => ['nullable', 'string', 'max:255'],
            'mensualidad'         => ['required', 'numeric', 'min:0'],
            'fecha_ingreso'       => ['required', 'date'],
            'fecha_promovido'     => ['nullable', 'date'],
            'foto'                => ['nullable', 'image', 'mimes:jpg,jpeg,png,gif', 'max:2048'],
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
