<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstitucionEducativa extends Model
{
    protected $table = 'institucion_educativa';
    protected $primaryKey = 'insti_id';

    protected $fillable = [
        'insti_ruc',
        'insti_razon_social',
        'insti_direccion',
        'insti_telefono1',
        'insti_telefono2',
        'insti_email',
        'insti_director',
        'insti_ndni',
        'insti_logo',
        'insti_estatus',
        'insti_sunat_usuario',
        'insti_sunat_clave',
        'insti_sunat_endpoint',
        'insti_certificado_path',
        'insti_certificado_enviado',
    ];

    protected $casts = [
        'insti_certificado_enviado' => 'boolean',
    ];

    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class, 'insti_id', 'insti_id');
    }
}
