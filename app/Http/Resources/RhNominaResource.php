<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RhNominaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'nomina_id' => $this->nomina_id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'nombre_completo' => $this->user->nombre_completo,
                'perfil' => $this->user->perfil ? [
                    'primer_nombre' => $this->user->perfil->primer_nombre,
                    'apellido_paterno' => $this->user->perfil->apellido_paterno,
                ] : null,
            ]),
            'mes' => $this->mes,
            'anio' => $this->anio,
            'periodo' => $this->periodo,
            'sueldo_base' => (float) $this->sueldo_base,
            'bonificaciones' => (float) $this->bonificaciones,
            'total_descuentos' => (float) $this->total_descuentos,
            'descuentos_tardanzas' => (float) $this->descuentos_tardanzas,
            'dias_trabajados' => $this->dias_trabajados,
            'dias_ausentes' => $this->dias_ausentes,
            'total_tardanzas' => $this->total_tardanzas,
            'sueldo_neto' => (float) $this->sueldo_neto,
            'estado' => $this->estado,
            'estado_label' => $this->estado_label,
            'fecha_pago' => $this->fecha_pago?->format('Y-m-d'),
            'observaciones' => $this->observaciones,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
