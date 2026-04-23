<?php

use App\Models\PadreApoderado;
use App\Models\Estudiante;
use App\Models\Pago;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$instiId = 8;

try {
    DB::beginTransaction();

    $dni = str_pad(rand(0, 99999999), 8, '0', STR_PAD_LEFT);

    $padre = PadreApoderado::create([
        'insti_id' => $instiId,
        'nombres' => 'TEST PADRE',
        'apellidos' => 'ANTIGRAVITY',
        'numero_doc' => $dni,
        'telefono_1' => '987654321',
        'parentesco' => 'padre',
        'es_pagador' => 'si',
        'estado' => 1
    ]);

    $estu = Estudiante::create([
        'insti_id' => $instiId,
        'primer_nombre' => 'TEST ALUMNO',
        'apellido_paterno' => 'ANTIGRAVITY',
        'estado' => '1',
        'mensualidad' => 500
    ]);

    DB::table('estudiante_contacto')->insert([
        'estu_id' => $estu->estu_id,
        'contacto_id' => $padre->id_contacto,
        'mensualidad' => 500
    ]);

    // Crear un pago con concepto 1 (Pensión)
    $pago = Pago::create([
        'insti_id' => $instiId,
        'estu_id' => $estu->estu_id,
        'contacto_id' => $padre->id_contacto,
        'concepto_id' => 1,
        'pag_anual' => 2026,
        'pag_mes' => 'ABRIL',
        'pag_monto' => 500,
        'total' => 500,
        'estatus' => 1,
        'pag_fecha' => now()
    ]);

    DB::commit();
    echo "SUCCESS_CONTACT_ID:" . $padre->id_contacto . "\n";

} catch (\Exception $e) {
    DB::rollBack();
    echo "ERROR:" . $e->getMessage() . "\n";
}
