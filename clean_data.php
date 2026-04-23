<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║  LIMPIANDO DATOS DE TABLAS                                     ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

try {
    // Deshabilitar restricciones de clave foránea
    DB::statement('SET FOREIGN_KEY_CHECKS=0');

    // Limpiar Matrícula
    echo "Limpiando Matriculas...\n";
    DB::table('matriculas')->truncate();
    echo "  ✅ Matriculas vaciadas\n";

    // Limpiar Horarios
    echo "\nLimpiando Horarios...\n";
    DB::table('horario_clases')->truncate();
    DB::table('horario_bloques')->truncate();
    DB::table('horarios_asistencia')->truncate();
    DB::table('docente_horarios')->truncate();
    DB::table('seccion_horarios')->truncate();
    echo "  ✅ Horarios vaciados\n";

    // Limpiar Niveles Académicos (Grados, Secciones)
    echo "\nLimpiando Niveles Académicos...\n";
    DB::table('secciones')->truncate();
    DB::table('grados')->truncate();
    DB::table('niveles_educativos')->truncate();
    echo "  ✅ Niveles Académicos vaciados\n";

    // Limpiar Configuración de Pagos (Conceptos, Tarifas, Descuentos)
    echo "\nLimpiando Configuración de Pagos...\n";
    DB::table('pagos')->truncate();
    DB::table('descuento_alumno')->truncate();
    DB::table('tarifa_pago')->truncate();
    DB::table('concepto_pago')->truncate();
    echo "  ✅ Configuración de Pagos vaciada\n";

    // Limpiar Estudiantes (pero NO provincia/distrito)
    echo "\nLimpiando Estudiantes...\n";
    DB::table('estudiantes')->truncate();
    echo "  ✅ Estudiantes vaciados\n";

    // Habilitar restricciones de clave foránea
    DB::statement('SET FOREIGN_KEY_CHECKS=1');

    echo "\n╔════════════════════════════════════════════════════════════════╗\n";
    echo "║  ✅ LIMPIEZA COMPLETADA EXITOSAMENTE                          ║\n";
    echo "║                                                                ║\n";
    echo "║  Tablas vaciadas:                                              ║\n";
    echo "║  ✅ Pagos                                                      ║\n";
    echo "║  ✅ Matriculas                                                 ║\n";
    echo "║  ✅ Horarios (clase, bloque, asistencia, docente, sección)     ║\n";
    echo "║  ✅ Niveles Académicos (sección, grado, nivel)                 ║\n";
    echo "║  ✅ Configuración de Pagos (descuentos, tarifas, conceptos)    ║\n";
    echo "║  ✅ Estudiantes                                                ║\n";
    echo "║                                                                ║\n";
    echo "║  Tablas PRESERVADAS:                                           ║\n";
    echo "║  ✅ Provincia                                                  ║\n";
    echo "║  ✅ Distrito                                                   ║\n";
    echo "║                                                                ║\n";
    echo "║  Sistema listo para testing desde cero                         ║\n";
    echo "╚════════════════════════════════════════════════════════════════╝\n\n";

} catch (\Exception $e) {
    echo "\n❌ ERROR: {$e->getMessage()}\n";
    echo "Stack: {$e->getTraceAsString()}\n";
    throw $e;
}
