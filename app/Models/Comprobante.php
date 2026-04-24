<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Comprobante extends Model
{
    protected $fillable = [
        'insti_id',
        'tipo_documento',
        'serie',
        'numero',
        'fecha_emision',
        'moneda',
        'forma_pago',
        'cliente_tipo_doc',
        'cliente_num_doc',
        'cliente_nombre',
        'cliente_direccion',
        'op_gravada',
        'igv',
        'total',
        'nombre_archivo',
        'hash',
        'qr_info',
        'contenido_xml',
        'estado',
        'sunat_response',
        'endpoint',
        'contacto_id',
        'estu_id',
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'op_gravada'    => 'decimal:2',
        'igv'           => 'decimal:2',
        'total'         => 'decimal:2',
        'numero'        => 'integer',
    ];

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(InstitucionEducativa::class, 'insti_id', 'insti_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ComprobanteItem::class, 'comprobante_id');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class, 'comprobante_id');
    }

    public function contacto(): BelongsTo
    {
        return $this->belongsTo(PadreApoderado::class, 'contacto_id', 'id_contacto');
    }

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Estudiante::class, 'estu_id', 'estu_id');
    }

    /** Nombre legible: B001-5 o F001-12 */
    public function getCodigoAttribute(): string
    {
        return "{$this->serie}-{$this->numero}";
    }
}
