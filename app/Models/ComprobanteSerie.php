<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComprobanteSerie extends Model
{
    protected $table = 'comprobante_series';

    protected $fillable = [
        'insti_id',
        'tipo_documento',
        'serie',
        'ultimo_numero',
        'activo',
    ];

    protected $casts = [
        'activo'         => 'boolean',
        'ultimo_numero'  => 'integer',
    ];

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(InstitucionEducativa::class, 'insti_id', 'insti_id');
    }

    public function comprobantes(): HasMany
    {
        return $this->hasMany(Comprobante::class, 'serie', 'serie')
                    ->where('insti_id', $this->insti_id);
    }

    /** Incrementa y devuelve el siguiente número correlativo (usa lock para concurrencia). */
    public function siguienteNumero(): int
    {
        $this->lockForUpdate()->refresh();
        $this->increment('ultimo_numero');

        return $this->ultimo_numero;
    }
}
