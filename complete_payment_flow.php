<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║  COMPLETANDO FLUJO DE PAGOS PARA ESTUDIANTE EXISTENTE          ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

try {
    // Obtener el estudiante con matrícula
    $matricula = DB::table('matriculas')->first();

    if (!$matricula) {
        echo "❌ No hay matrículas en el sistema\n";
        exit(1);
    }

    $estudiante = DB::table('estudiantes')
        ->where('estu_id', $matricula->estu_id)
        ->first();

    if (!$estudiante) {
        echo "❌ No se encontró estudiante\n";
        exit(1);
    }

    // Obtener nombre del perfil
    $perfil = DB::table('perfiles')
        ->where('perfil_id', $estudiante->perfil_id)
        ->first();

    $nombre = $perfil ? trim($perfil->primer_nombre . ' ' . $perfil->apellido_paterno . ' ' . $perfil->apellido_materno) : 'Desconocido';

    echo "✅ Estudiante encontrado: {$nombre}\n";
    echo "   ID: {$estudiante->estu_id}\n\n";

    echo "✅ Matrícula encontrada: {$matricula->matricula_id}\n";
    echo "   Sección: {$matricula->seccion_id}\n\n";

    // Obtener grado de la sección
    $seccion = DB::table('secciones')
        ->where('seccion_id', $matricula->seccion_id)
        ->first();

    if (!$seccion) {
        echo "❌ No se encontró sección\n";
        exit(1);
    }

    $grado_id = $seccion->id_grado;

    // Obtener nivel del grado
    $grado = DB::table('grados')
        ->where('grado_id', $grado_id)
        ->first();

    if (!$grado) {
        echo "❌ No se encontró grado\n";
        exit(1);
    }

    $nivel_id = $grado->nivel_id;

    // Verificar si ya existen conceptos de pago
    $conceptos = DB::table('concepto_pago')
        ->where('insti_id', 8)
        ->get();

    if ($conceptos->isEmpty()) {
        echo "❌ No hay conceptos de pago creados\n";
        echo "   Crea conceptos primero en: http://127.0.0.1:8000/concepto-pago\n";
        exit(1);
    }

    echo "✅ Conceptos de pago encontrados: " . $conceptos->count() . "\n";
    foreach ($conceptos as $concepto) {
        echo "   - {$concepto->nombre} (ID: {$concepto->concepto_id}, Opcional: " . ($concepto->opcional ? 'Sí' : 'No') . ")\n";
    }
    echo "\n";

    // Verificar si existen tarifas para el nivel
    $tarifas = DB::table('tarifa_pago')
        ->where('nivel_id', $nivel_id)
        ->get();

    if ($tarifas->isEmpty()) {
        echo "❌ No hay tarifas creadas para el nivel {$nivel_id}\n";
        echo "   Crea tarifas primero en: http://127.0.0.1:8000/tarifa-pago\n";
        exit(1);
    }

    echo "✅ Tarifas encontradas para el nivel: " . $tarifas->count() . "\n";
    foreach ($tarifas as $tarifa) {
        $concepto = $conceptos->where('concepto_id', $tarifa->concepto_id)->first();
        echo "   - {$concepto->nombre}: S/ " . number_format($tarifa->monto, 2) . "\n";
    }
    echo "\n";

    // Generar pagos
    echo "Generando pagos...\n";
    $pagos_creados = 0;

    foreach ($tarifas as $tarifa) {
        // Verificar si el pago ya existe
        $pago_existe = DB::table('pagos')
            ->where('estu_id', $estudiante->estu_id)
            ->where('concepto_id', $tarifa->concepto_id)
            ->exists();

        if ($pago_existe) {
            echo "   ⚠️  Pago ya existe para concepto ID {$tarifa->concepto_id}\n";
            continue;
        }

        // Obtener concepto
        $concepto = $conceptos->where('concepto_id', $tarifa->concepto_id)->first();

        // Crear pago
        $pago_id = DB::table('pagos')->insertGetId([
            'estu_id' => $estudiante->estu_id,
            'insti_id' => 8,
            'concepto_id' => $tarifa->concepto_id,
            'pag_anual' => 2026,
            'pag_monto' => $tarifa->monto,
            'total' => $tarifa->monto,
            'estatus' => 0,
            'pag_fecha' => now()->format('Y-m-d'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        echo "   ✅ Pago creado: {$concepto->nombre} - S/ " . number_format($tarifa->monto, 2) . " (ID: {$pago_id})\n";
        $pagos_creados++;
    }

    echo "\n╔════════════════════════════════════════════════════════════════╗\n";
    echo "║  ✅ FLUJO COMPLETADO EXITOSAMENTE                             ║\n";
    echo "║                                                                ║\n";
    echo "║  Resumen:                                                      ║\n";
    echo "║  ✅ Estudiante: {$nombre}                                      ║\n";
    echo "║  ✅ Matrícula: {$matricula->matricula_id}                      ║\n";
    echo "║  ✅ Pagos generados: {$pagos_creados}                          ║\n";
    echo "║                                                                ║\n";
    echo "║  Ahora puedes ver los pagos en:                                ║\n";
    echo "║  http://127.0.0.1:8000/pagos                                   ║\n";
    echo "║  http://127.0.0.1:8000/api/pagos/pagadores                     ║\n";
    echo "╚════════════════════════════════════════════════════════════════╝\n\n";

} catch (\Exception $e) {
    echo "\n❌ ERROR: {$e->getMessage()}\n";
    echo "Stack: {$e->getTraceAsString()}\n";
    throw $e;
}
