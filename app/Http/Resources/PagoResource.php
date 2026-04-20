<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PagoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'pag_id'       => $this->pag_id,
            'contacto_id'  => $this->contacto_id,
            'estu_id'      => $this->estu_id,
            'pag_anual'    => $this->pag_anual,
            'pag_mes'      => $this->pag_mes,
            'pag_monto'    => $this->pag_monto,
            'pag_nombre1'  => $this->pag_nombre1,
            'pag_otro1'    => $this->pag_otro1,
            'pag_nombre2'  => $this->pag_nombre2,
            'pag_otro2'    => $this->pag_otro2,
            'total'        => $this->total,
            'pag_notifica' => $this->pag_notifica,
            'pag_fecha'    => $this->pag_fecha?->toDateString(),
            'estatus'      => $this->estatus,
            'observacion'  => $this->observacion,
        ];
    }
}