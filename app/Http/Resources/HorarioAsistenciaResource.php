<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HorarioAsistenciaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'horario_id' => $this->horario_id,
            'insti_id' => $this->insti_id,
            'nivel_id' => $this->nivel_id,
            'tipo_usuario' => $this->tipo_usuario,
            'rol_id' => $this->rol_id,
            'tipo_usuario_texto' => match($this->tipo_usuario) {
                'E' => 'Estudiante',
                'D' => 'Docente',
                'T' => 'Trabajador',
                default => '—',
            },
            'turno' => $this->turno,
            'turno_texto' => match($this->turno) {
                'M' => 'Mañana',
                'T' => 'Tarde',
                'N' => 'Noche',
                default => '—',
            },
            'hora_ingreso' => $this->hora_ingreso,
            'hora_salida' => $this->hora_salida,
            'minutos_tolerancia' => $this->minutos_tolerancia ?? 15,
            
            // Relaciones
            'rol' => $this->whenLoaded('rol', function () {
                return [
                    'id' => $this->rol->id,
                    'name' => $this->rol->name,
                ];
            }),
            
            'nivel' => $this->whenLoaded('nivel', function () {
                return [
                    'nivel_id' => $this->nivel->nivel_id,
                    'nombre_nivel' => $this->nivel->nombre_nivel,
                ];
            }),
            
            'institucion' => $this->whenLoaded('institucion', function () {
                return [
                    'insti_id' => $this->institucion->insti_id,
                    'nombre' => $this->institucion->nombre,
                ];
            }),
            
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
