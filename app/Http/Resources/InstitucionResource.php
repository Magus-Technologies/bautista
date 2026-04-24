<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class InstitucionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'insti_id'           => $this->insti_id,
            'insti_ruc'          => $this->insti_ruc,
            'insti_razon_social' => $this->insti_razon_social,
            'insti_direccion'    => $this->insti_direccion,
            'insti_telefono1'    => $this->insti_telefono1,
            'insti_telefono2'    => $this->insti_telefono2,
            'insti_email'        => $this->insti_email,
            'insti_director'     => $this->insti_director,
            'insti_ndni'         => $this->insti_ndni,
            'insti_logo'                  => $this->insti_logo
                ? Storage::disk('public')->url($this->insti_logo)
                : null,
            'insti_estatus'               => $this->insti_estatus,
            'insti_sunat_usuario'         => $this->insti_sunat_usuario,
            'insti_sunat_clave'           => $this->insti_sunat_clave,
            'insti_sunat_endpoint'        => $this->insti_sunat_endpoint ?? 'beta',
            'insti_certificado_enviado'   => (bool) $this->insti_certificado_enviado,
        ];
    }
}
