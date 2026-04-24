<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PagoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'pag_id'          => $this->pag_id,
            'contacto_id'     => $this->contacto_id,
            'estu_id'         => $this->estu_id,
            'concepto_id'     => $this->concepto_id,
            'concepto_nombre' => $this->concepto?->nombre,
            'periodicidad'    => $this->concepto?->periodicidad,
            'pag_anual'       => $this->pag_anual,
            'pag_mes'         => $this->pag_mes,
            'pag_monto'       => $this->pag_monto,
            // Legacy — se mantienen para compatibilidad con datos anteriores
            'pag_nombre1'     => $this->pag_nombre1,
            'pag_otro1'       => $this->pag_otro1,
            'pag_nombre2'     => $this->pag_nombre2,
            'pag_otro2'       => $this->pag_otro2,
            'total'           => $this->total,
            'pag_notifica'    => $this->pag_notifica,
            'pag_fecha'       => $this->pag_fecha?->toDateString(),
            'estatus'         => $this->estatus,
            'comprobante_id'  => $this->comprobante_id,
            'observacion'     => $this->observacion,
            'ultimo_voucher'  => $this->whenLoaded('notificas', function () {
                $v = $this->notificas->sortByDesc('created_at')->first();
                if (!$v) return null;
                return [
                    'id'         => $v->id,
                    'estado'     => strtolower($v->estado),
                    'comentario' => $v->comentario,
                    'archivo_url'=> $v->archivo ? asset('storage/' . $v->archivo) : null,
                ];
            }),
        ];
    }
}
