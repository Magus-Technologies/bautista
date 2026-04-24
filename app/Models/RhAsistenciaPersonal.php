<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RhAsistenciaPersonal extends Model
{
    protected $table = 'rh_asistencia_personal';
    protected $primaryKey = 'asistencia_personal_id';

    protected $fillable = [
        'user_id', 'contrato_id', 'insti_id', 'fecha', 'hora_entrada', 'hora_salida',
        'estado', 'minutos_tardanza', 'descuento_aplicado', 'observaciones',
        'tipo_registro', 'registrado_por',
    ];

    protected $casts = [
        'fecha' => 'date',
        'descuento_aplicado' => 'decimal:2',
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

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    // Helpers
    public function getEstadoLabelAttribute(): string
    {
        return match($this->estado) {
            'presente' => 'Presente',
            'ausente' => 'Ausente',
            'tardanza' => 'Tardanza',
            'permiso' => 'Permiso',
            'vacaciones' => 'Vacaciones',
            'licencia' => 'Licencia',
            default => '—',
        };
    }

    public function getEstadoBadgeColorAttribute(): string
    {
        return match($this->estado) {
            'presente' => 'success',
            'ausente' => 'destructive',
            'tardanza' => 'warning',
            'permiso' => 'secondary',
            'vacaciones' => 'info',
            'licencia' => 'secondary',
            default => 'default',
        };
    }
}
