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
        'comprobante_referencia_id',
        'tipo_nota',
        'motivo_nota',
        'documento_referencia_tipo',
        'documento_referencia_serie',
        'documento_referencia_numero',
        'documento_referencia_fecha',
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'op_gravada'    => 'decimal:2',
        'igv'           => 'decimal:2',
        'total'         => 'decimal:2',
        'numero'        => 'integer',
        'documento_referencia_numero' => 'integer',
        'documento_referencia_fecha'  => 'date',
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

    /**
     * Relación con el comprobante original (para notas de crédito/débito)
     */
    public function comprobanteReferencia(): BelongsTo
    {
        return $this->belongsTo(Comprobante::class, 'comprobante_referencia_id');
    }

    /**
     * Notas de crédito emitidas sobre este comprobante
     */
    public function notasCredito(): HasMany
    {
        return $this->hasMany(Comprobante::class, 'comprobante_referencia_id')
                    ->where('tipo_documento', 'nota_credito');
    }

    /**
     * Notas de débito emitidas sobre este comprobante
     */
    public function notasDebito(): HasMany
    {
        return $this->hasMany(Comprobante::class, 'comprobante_referencia_id')
                    ->where('tipo_documento', 'nota_debito');
    }

    /**
     * Verifica si este comprobante es una nota (crédito o débito)
     */
    public function esNota(): bool
    {
        return in_array($this->tipo_documento, ['nota_credito', 'nota_debito']);
    }

    /**
     * Calcula el monto neto después de aplicar notas de crédito y débito
     */
    public function getMontoNetoAttribute(): float
    {
        if ($this->esNota()) {
            return (float) $this->total;
        }

        $total = (float) $this->total;
        
        // Restar notas de crédito aceptadas
        $total -= $this->notasCredito()
                       ->whereIn('estado', ['aceptado', 'enviado'])
                       ->sum('total');
        
        // Sumar notas de débito aceptadas
        $total += $this->notasDebito()
                       ->whereIn('estado', ['aceptado', 'enviado'])
                       ->sum('total');
        
        return $total;
    }

    /**
     * Calcula el monto disponible para emitir notas de crédito
     */
    public function getMontoDisponibleAttribute(): float
    {
        return $this->monto_neto;
    }
}
