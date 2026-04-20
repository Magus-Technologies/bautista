<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TarifaPago extends Model
{
    protected $table      = 'tarifa_pago';
    protected $primaryKey = 'tarifa_id';

    protected $fillable = [
        'insti_id',
        'concepto_id',
        'grado_id',
        'anio_escolar',
        'monto',
        'dia_vencimiento',
        'activo',
    ];

    protected $casts = [
        'monto'  => 'decimal:2',
        'activo' => 'boolean',
    ];

    public function concepto(): BelongsTo
    {
        return $this->belongsTo(ConceptoPago::class, 'concepto_id', 'concepto_id');
    }

    public function grado(): BelongsTo
    {
        return $this->belongsTo(Grado::class, 'grado_id', 'grado_id');
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(InstitucionEducativa::class, 'insti_id', 'insti_id');
    }
}
