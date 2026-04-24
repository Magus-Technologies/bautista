<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RhAsistenciaPersonalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'asistencia_personal_id' => $this->asistencia_personal_id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'nombre_completo' => $this->user->nombre_completo,
                'perfil' => $this->user->perfil ? [
                    'primer_nombre' => $this->user->perfil->primer_nombre,
                    'apellido_paterno' => $this->user->perfil->apellido_paterno,
                    'apellido_materno' => $this->user->perfil->apellido_materno,
                    'foto_perfil' => $this->user->perfil->foto_perfil,
                ] : null,
            ]),
            'contrato_id' => $this->contrato_id,
            'fecha' => $this->fecha?->format('Y-m-d'),
            'hora_entrada' => $this->hora_entrada,
            'hora_salida' => $this->hora_salida,
            'estado' => $this->estado,
            'estado_label' => $this->estado_label,
            'estado_badge_color' => $this->estado_badge_color,
            'minutos_tardanza' => $this->minutos_tardanza,
            'descuento_aplicado' => (float) $this->descuento_aplicado,
            'observaciones' => $this->observaciones,
            'tipo_registro' => $this->tipo_registro,
            'registrado_por' => $this->registrado_por,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
