<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║  ASIGNANDO PADRE/APODERADO AL ESTUDIANTE                       ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

try {
    // Obtener el estudiante con matrícula
    $matricula = DB::table('matriculas')->first();
    $estudiante = DB::table('estudiantes')
        ->where('estu_id', $matricula->estu_id)
        ->first();

    echo "✅ Estudiante: " . $estudiante->estu_id . "\n\n";

    // Verificar si ya tiene un padre asignado
    $contacto_existe = DB::table('estudiante_contacto')
        ->where('estu_id', $estudiante->estu_id)
        ->first();

    if ($contacto_existe) {
        echo "⚠️  El estudiante ya tiene un padre asignado (ID: {$contacto_existe->contacto_id})\n";
        exit(0);
    }

    // Crear un padre/apoderado
    echo "Creando padre/apoderado...\n";
    $padre_id = DB::table('padre_apoderado')->insertGetId([
        'insti_id' => 8,
        'nombres' => 'Carlos',
        'apellidos' => 'Pérez García',
        'numero_doc' => '12345678',
        'telefono_1' => '987654321',
        'es_pagador' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    echo "✅ Padre creado: ID {$padre_id}\n\n";

    // Vincular padre al estudiante
    echo "Vinculando padre al estudiante...\n";
    DB::table('estudiante_contacto')->insert([
        'estu_id' => $estudiante->estu_id,
        'contacto_id' => $padre_id,
        'mensualidad' => 500,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    echo "✅ Padre vinculado al estudiante\n\n";

    echo "╔════════════════════════════════════════════════════════════════╗\n";
    echo "║  ✅ ASIGNACIÓN COMPLETADA                                     ║\n";
    echo "║                                                                ║\n";
    echo "║  Ahora puedes ver los pagos en:                                ║\n";
    echo "║  http://127.0.0.1:8000/pagos                                   ║\n";
    echo "║  http://127.0.0.1:8000/api/pagos/pagadores                     ║\n";
    echo "╚════════════════════════════════════════════════════════════════╝\n\n";

} catch (\Exception $e) {
    echo "\n❌ ERROR: {$e->getMessage()}\n";
    throw $e;
}
