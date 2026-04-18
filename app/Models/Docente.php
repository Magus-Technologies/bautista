<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Docente extends Model
{
    protected $primaryKey = 'docente_id';

    protected $fillable = [
        'id_insti', 'id_perfil', 'id_usuario',
        'especialidad', 'planilla', 'turno', 'estado',
    ];

    public function perfil(): BelongsTo
    {
        return $this->belongsTo(Perfil::class, 'id_perfil', 'perfil_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(InstitucionEducativa::class, 'id_insti', 'insti_id');
    }

    public function getNombreCompletoAttribute(): string
    {
        if ($this->perfil) {
            return trim(implode(' ', array_filter([
                $this->perfil->primer_nombre,
                $this->perfil->apellido_paterno,
                $this->perfil->apellido_materno,
            ])));
        }
        return $this->user?->name ?? '—';
    }
}
