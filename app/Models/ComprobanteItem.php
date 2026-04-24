<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComprobanteItem extends Model
{
    protected $fillable = [
        'comprobante_id',
        'pag_id',
        'cod_producto',
        'unidad',
        'descripcion',
        'cantidad',
        'precio_unitario',
        'subtotal',
    ];

    protected $casts = [
        'precio_unitario' => 'decimal:2',
        'subtotal'        => 'decimal:2',
        'cantidad'        => 'integer',
    ];

    public function comprobante(): BelongsTo
    {
        return $this->belongsTo(Comprobante::class, 'comprobante_id');
    }

    public function pago(): BelongsTo
    {
        return $this->belongsTo(Pago::class, 'pag_id', 'pag_id');
    }
}
