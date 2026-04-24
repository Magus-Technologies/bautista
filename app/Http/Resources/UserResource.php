<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'username'    => $this->username,
            'name'        => $this->nombre_completo,
            'nombre_completo' => $this->nombre_completo,
            'email'       => $this->email,
            'avatar'      => $this->avatar,
            'estado'      => $this->estado,
            'rol'         => $this->rol?->name,
            'rol_name'    => $this->rol?->name,
            'rol_display_name' => $this->rol?->display_name,
            'perfil'      => $this->whenLoaded('perfil'),
            'estudiante'  => $this->whenLoaded('estudiante'),
            'docente'     => $this->whenLoaded('docente', fn () => [
                'docente_id'   => $this->docente->docente_id,
                'especialidad' => $this->docente->especialidad,
                'planilla'     => $this->docente->planilla,
                'turno'        => $this->docente->turno,
                'estado'       => $this->docente->estado,
            ]),
            'institucion' => $this->whenLoaded('institucion', fn () =>
                $this->institucion?->only(['insti_id', 'insti_razon_social', 'insti_logo'])
            ),
        ];
    }
}
