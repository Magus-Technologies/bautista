<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConfiguracionComprobante extends Model
{
    protected $table = 'configuracion_comprobante';

    protected $fillable = [
        'insti_id',
        'mostrar_logo',
        'color_primario',
        'color_secundario',
        'color_fondo_header',
        'color_texto_comprobante',
        'color_texto_secundario',
        'texto_pie_pagina',
        'texto_adicional',
        'mostrar_qr',
        'mostrar_hash',
        'mostrar_firma_digital',
        'mostrar_telefono',
        'mostrar_email',
        'formato_serie',
        'digitos_numero',
        'tamano_fuente_base',
        'tamano_fuente_titulo',
    ];

    protected $casts = [
        'mostrar_logo' => 'boolean',
        'mostrar_qr' => 'boolean',
        'mostrar_hash' => 'boolean',
        'mostrar_firma_digital' => 'boolean',
        'mostrar_telefono' => 'boolean',
        'mostrar_email' => 'boolean',
        'digitos_numero' => 'integer',
        'tamano_fuente_base' => 'integer',
        'tamano_fuente_titulo' => 'integer',
    ];

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(InstitucionEducativa::class, 'insti_id', 'insti_id');
    }
}
