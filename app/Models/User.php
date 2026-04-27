<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles;

    protected $fillable = [
        'insti_id',
        'rol_id',
        'username',
        'name',
        'email',
        'password',
        'estado',
        'es_trabajador',
    ];

    protected $appends = ['nombre_completo', 'avatar'];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'       => 'datetime',
            'password'                => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'es_trabajador'           => 'boolean',
        ];
    }

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'rol_id');
    }

    // Eliminados métodos manuales hasRole, hasAnyRole y assignRole
    // Spatie Permission ahora maneja esto a través del trait HasRoles.

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(InstitucionEducativa::class, 'insti_id', 'insti_id');
    }

    public function perfil(): HasOne
    {
        return $this->hasOne(Perfil::class, 'user_id');
    }

    public function estudiante(): HasOne
    {
        return $this->hasOne(Estudiante::class, 'user_id');
    }

    public function docente(): HasOne
    {
        return $this->hasOne(Docente::class, 'id_usuario');
    }

    public function padreApoderado(): HasOne
    {
        return $this->hasOne(PadreApoderado::class, 'user_id');
    }

    public function loginHistories(): HasMany
    {
        return $this->hasMany(LoginHistory::class, 'user_id');
    }

    public function rhAsistencias(): HasMany
    {
        return $this->hasMany(RhAsistenciaPersonal::class, 'user_id');
    }

    /**
     * @deprecated Usar HorarioResolverService::resolverParaTrabajador() — devuelve el horario
     * activo según proximidad temporal ±2h, no un único horario estático por rol.
     */
    public function horarioAsistencia(): HasOne
    {
        return $this->hasOne(HorarioAsistencia::class, 'rol_id', 'rol_id')
            ->where('tipo_usuario', 'T');
    }

    public function isActivo(): bool
    {
        return $this->estado === '1';
    }

    public function isBloqueado(): bool
    {
        return $this->estado === '5';
    }

    public function getNombreCompletoAttribute(): string
    {
        $perfil = $this->perfil;
        if ($perfil) {
            return trim("{$perfil->primer_nombre} {$perfil->apellido_paterno} {$perfil->apellido_materno}");
        }
        return $this->name ?? $this->username;
    }

    public function getAvatarAttribute(): ?string
    {
        $perfil = $this->perfil;
        if ($perfil && $perfil->foto_perfil) {
            return asset('storage/' . $perfil->foto_perfil);
        }
        return null;
    }

    /**
     * Determina si el usuario es trabajador basado en su rol
     * Un usuario es trabajador si tiene rol de docente o rh
     */
    public function getEsTrabajadorAttribute(): bool
    {
        // Si tiene el campo es_trabajador en la BD, usarlo
        if (isset($this->attributes['es_trabajador'])) {
            return (bool) $this->attributes['es_trabajador'];
        }

        // Determinar automáticamente por rol
        return $this->hasAnyRole(['docente', 'rh']);
    }

    /**
     * Scope para filtrar solo trabajadores
     */
    public function scopeTrabajadores($query)
    {
        return $query->where('es_trabajador', true)
            ->orWhereHas('roles', function ($q) {
                $q->whereIn('name', ['docente', 'rh']);
            });
    }
}
