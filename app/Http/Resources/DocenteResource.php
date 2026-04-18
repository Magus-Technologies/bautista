<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocenteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'docente_id'      => $this->docente_id,
            'nombre_completo' => $this->nombre_completo,
            'especialidad'    => $this->especialidad,
            'planilla'        => $this->planilla,
            'turno'           => $this->turno,
            'estado'          => $this->estado,
            'perfil'      => $this->whenLoaded('perfil', fn () => [
                'primer_nombre'    => $this->perfil->primer_nombre,
                'apellido_paterno' => $this->perfil->apellido_paterno,
                'apellido_materno' => $this->perfil->apellido_materno,
                'genero'           => $this->perfil->genero,
                'doc_numero'       => $this->perfil->doc_numero,
                'telefono'         => $this->perfil->telefono,
            ]),
            'user' => $this->whenLoaded('user', fn () => [
                'id'       => $this->user->id,
                'username' => $this->user->username,
                'email'    => $this->user->email,
            ]),
        ];
    }
}
