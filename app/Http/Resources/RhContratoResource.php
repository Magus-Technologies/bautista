<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RhContratoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'contrato_id' => $this->contrato_id,
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
                'horario_asistencia' => $this->user->horarioAsistencia ? [
                    'hora_ingreso' => $this->user->horarioAsistencia->hora_ingreso,
                    'hora_salida' => $this->user->horarioAsistencia->hora_salida,
                    'minutos_tolerancia' => $this->user->horarioAsistencia->minutos_tolerancia,
                ] : null,
            ]),
            'tipo_contrato' => $this->tipo_contrato,
            'tipo_contrato_label' => $this->tipo_contrato_label,
            'sueldo_base' => (float) $this->sueldo_base,
            'bonificaciones' => (float) $this->bonificaciones,
            'horas_semanales' => $this->horas_semanales,
            'hora_entrada' => $this->user?->horarioAsistencia?->hora_ingreso,
            'hora_salida' => $this->user?->horarioAsistencia?->hora_salida,
            'minutos_tolerancia' => $this->user?->horarioAsistencia?->minutos_tolerancia ?? 0,
            'descuento_por_tardanza' => (float) $this->descuento_por_tardanza,
            'tipo_descuento' => $this->tipo_descuento,
            'fecha_inicio' => $this->fecha_inicio?->format('Y-m-d'),
            'fecha_fin' => $this->fecha_fin?->format('Y-m-d'),
            'estado' => $this->estado,
            'estado_label' => $this->estado_label,
            'observaciones' => $this->observaciones,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
