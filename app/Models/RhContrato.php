<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RhContrato extends Model
{
    protected $table = 'rh_contratos';
    protected $primaryKey = 'contrato_id';

    protected $fillable = [
        'user_id', 'insti_id', 'tipo_contrato', 'sueldo_base', 'bonificaciones',
        'horas_semanales', 'descuento_por_tardanza', 'tipo_descuento', 'fecha_inicio', 'fecha_fin',
        'estado', 'observaciones',
    ];

    protected $casts = [
        'sueldo_base' => 'decimal:2',
        'bonificaciones' => 'decimal:2',
        'descuento_por_tardanza' => 'decimal:2',
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(InstitucionEducativa::class, 'insti_id', 'insti_id');
    }

    public function asistencias(): HasMany
    {
        return $this->hasMany(RhAsistenciaPersonal::class, 'contrato_id', 'contrato_id');
    }

    public function nominas(): HasMany
    {
        return $this->hasMany(RhNomina::class, 'contrato_id', 'contrato_id');
    }

    // Helpers
    public function getTipoContratoLabelAttribute(): string
    {
        return match($this->tipo_contrato) {
            'tiempo_completo' => 'Tiempo Completo',
            'medio_tiempo' => 'Medio Tiempo',
            'por_horas' => 'Por Horas',
            'practicante' => 'Practicante',
            default => '—',
        };
    }

    public function getEstadoLabelAttribute(): string
    {
        return match($this->estado) {
            'activo' => 'Activo',
            'suspendido' => 'Suspendido',
            'finalizado' => 'Finalizado',
            default => '—',
        };
    }

    public function isActivo(): bool
    {
        return $this->estado === 'activo';
    }
}
