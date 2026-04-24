<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RhNomina extends Model
{
    protected $table = 'rh_nomina';
    protected $primaryKey = 'nomina_id';

    protected $fillable = [
        'user_id', 'contrato_id', 'insti_id', 'mes', 'anio',
        'sueldo_base', 'bonificaciones', 'total_descuentos', 'descuentos_tardanzas',
        'dias_trabajados', 'dias_ausentes', 'total_tardanzas', 'sueldo_neto',
        'estado', 'fecha_pago', 'observaciones',
    ];

    protected $casts = [
        'sueldo_base' => 'decimal:2',
        'bonificaciones' => 'decimal:2',
        'total_descuentos' => 'decimal:2',
        'descuentos_tardanzas' => 'decimal:2',
        'sueldo_neto' => 'decimal:2',
        'fecha_pago' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contrato(): BelongsTo
    {
        return $this->belongsTo(RhContrato::class, 'contrato_id', 'contrato_id');
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(InstitucionEducativa::class, 'insti_id', 'insti_id');
    }

    // Helpers
    public function getEstadoLabelAttribute(): string
    {
        return match($this->estado) {
            'pendiente' => 'Pendiente',
            'aprobado' => 'Aprobado',
            'pagado' => 'Pagado',
            default => '—',
        };
    }

    public function getPeriodoAttribute(): string
    {
        $meses = [
            1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
            5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
            9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
        ];
        return ($meses[$this->mes] ?? '') . ' ' . $this->anio;
    }
}
