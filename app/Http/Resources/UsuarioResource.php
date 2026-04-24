<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->id,
            'username' => $this->username,
            'name'     => $this->name,
            'nombre_completo' => $this->nombre_completo,
            'email'    => $this->email,
            'estado'   => $this->estado,
            'es_trabajador' => $this->es_trabajador,
            'rol'      => $this->rol?->name,
            'rol_name' => $this->rol?->name,
            'rol_display_name' => $this->rol?->display_name,
            'perfil'   => $this->whenLoaded('perfil', fn () => $this->perfil ? [
                'primer_nombre'    => $this->perfil->primer_nombre,
                'segundo_nombre'   => $this->perfil->segundo_nombre,
                'apellido_paterno' => $this->perfil->apellido_paterno,
                'apellido_materno' => $this->perfil->apellido_materno,
                'genero'           => $this->perfil->genero,
                'tipo_doc'         => $this->perfil->tipo_doc,
                'doc_numero'       => $this->perfil->doc_numero,
                'fecha_nacimiento' => $this->perfil->fecha_nacimiento,
                'telefono'         => $this->perfil->telefono,
                'direccion'        => $this->perfil->direccion,
            ] : null),
        ];
    }
}
