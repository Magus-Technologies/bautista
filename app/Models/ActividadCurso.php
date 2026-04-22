<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ActividadCurso extends Model
{
    protected $table = 'actividad_curso';
    protected $primaryKey = 'actividad_id';

    protected $fillable = [
        'id_curso', 'id_clase_curso', 'id_tipo_actividad',
        'nombre_actividad', 'descripcion_corta', 'descripcion_larga',
        'fecha_inicio', 'fecha_cierre',
        'nota_visible', 'nota_actividad', 'respuesta_visible',
        'ocultar_actividad', 'estado', 'es_calificado',
        'peso_porcentaje', 'puntos_maximos', 'allowed_formats',
    ];

    protected $casts = [
        'fecha_inicio' => 'datetime',
        'fecha_cierre' => 'datetime',
    ];

    public function tipoActividad(): BelongsTo
    {
        return $this->belongsTo(TipoActividad::class, 'id_tipo_actividad', 'tipo_id');
    }

    public function clase(): BelongsTo
    {
        return $this->belongsTo(Clase::class, 'id_clase_curso', 'clase_id');
    }

    public function cuestionario(): HasOne
    {
        return $this->hasOne(Cuestionario::class, 'id_actividad', 'actividad_id');
    }

    public function notasActividad(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(NotaActividad::class, 'actividad_id', 'actividad_id');
    }
}
