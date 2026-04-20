<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConceptoPago extends Model
{
    protected $table      = 'concepto_pago';
    protected $primaryKey = 'concepto_id';

    protected $fillable = [
        'insti_id',
        'nombre',
        'descripcion',
        'periodicidad',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(InstitucionEducativa::class, 'insti_id', 'insti_id');
    }

    public function tarifas(): HasMany
    {
        return $this->hasMany(TarifaPago::class, 'concepto_id', 'concepto_id');
    }

    public function descuentos(): HasMany
    {
        return $this->hasMany(DescuentoAlumno::class, 'concepto_id', 'concepto_id');
    }
}
