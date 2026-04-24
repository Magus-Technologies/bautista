<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HorarioAsistencia extends Model
{
    protected $table = 'horarios_asistencia';
    protected $primaryKey = 'horario_id';

    protected $fillable = [
        'insti_id', 'nivel_id', 'tipo_usuario', 'rol_id', 'turno',
        'hora_ingreso', 'hora_salida', 'minutos_tolerancia',
    ];

    public function nivel(): BelongsTo
    {
        return $this->belongsTo(NivelEducativo::class, 'nivel_id', 'nivel_id');
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(InstitucionEducativa::class, 'insti_id', 'insti_id');
    }

    public function rol(): BelongsTo
    {
        return $this->belongsTo(\Spatie\Permission\Models\Role::class, 'rol_id', 'id');
    }
}
