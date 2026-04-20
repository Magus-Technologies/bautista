<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pago extends Model
{
    protected $primaryKey = 'pag_id';

    protected $fillable = [
        'insti_id',
        'estu_id',
        'contacto_id',
        'pag_anual',
        'pag_mes',
        'pag_monto',
        'pag_nombre1',
        'pag_otro1',
        'pag_nombre2',
        'pag_otro2',
        'total',
        'pag_notifica',
        'pag_fecha',
        'estatus',
        'observacion',
    ];

    protected $casts = [
        'pag_fecha'  => 'date',
        'pag_monto'  => 'decimal:2',
        'pag_otro1'  => 'decimal:2',
        'pag_otro2'  => 'decimal:2',
        'total'      => 'decimal:2',
        'estatus'    => 'integer',
    ];

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Estudiante::class, 'estu_id', 'estu_id');
    }

    public function contacto(): BelongsTo
    {
        return $this->belongsTo(PadreApoderado::class, 'contacto_id', 'id_contacto');
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(InstitucionEducativa::class, 'insti_id', 'insti_id');
    }

    public function notificas(): HasMany
    {
        return $this->hasMany(PagoNotifica::class, 'pag_id', 'pag_id');
    }
}