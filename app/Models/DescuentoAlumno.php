<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DescuentoAlumno extends Model
{
    protected $table      = 'descuento_alumno';
    protected $primaryKey = 'descuento_id';

    protected $fillable = [
        'insti_id',
        'estu_id',
        'concepto_id',
        'motivo',
        'tipo',
        'valor',
        'fecha_inicio',
        'fecha_fin',
        'observacion',
        'activo',
    ];

    protected $casts = [
        'valor'       => 'decimal:2',
        'fecha_inicio' => 'date',
        'fecha_fin'    => 'date',
        'activo'       => 'boolean',
    ];

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Estudiante::class, 'estu_id', 'estu_id');
    }

    public function concepto(): BelongsTo
    {
        return $this->belongsTo(ConceptoPago::class, 'concepto_id', 'concepto_id');
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(InstitucionEducativa::class, 'insti_id', 'insti_id');
    }
}
