<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\RhContrato;
use App\Models\HorarioAsistencia;
use App\Models\RhAsistenciaPersonal;
use App\Services\Implements\RhAsistenciaPersonalService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

echo "--- INICIANDO TEST DE FLUJO ASISTENCIA + RH ---\n";

DB::beginTransaction();

try {
    // 1. Configuración de datos de prueba
    $instiId = DB::table('institucion_educativa')->value('insti_id') ?? 1;
    $rolId = DB::table('roles')->where('name', 'docente')->value('id') ?? 1;

    $user = User::create([
        'name' => 'Test Worker',
        'email' => 'testworker@example.com',
        'username' => 'testworker',
        'password' => bcrypt('password'),
        'rol_id' => $rolId,
        'insti_id' => $instiId,
        'es_trabajador' => true,
        'estado' => '1'
    ]);

    echo "✅ Usuario creado: ID {$user->id}\n";

    // Horario Mañana: 08:00 - 13:00
    $horarioM = HorarioAsistencia::create([
        'insti_id' => $instiId,
        'rol_id' => $rolId,
        'tipo_usuario' => 'T',
        'turno' => 'M',
        'hora_ingreso' => '08:00:00',
        'hora_salida' => '13:00:00',
        'minutos_tolerancia' => 10
    ]);

    // Horario Tarde: 14:00 - 18:00
    $horarioT = HorarioAsistencia::create([
        'insti_id' => $instiId,
        'rol_id' => $rolId,
        'tipo_usuario' => 'T',
        'turno' => 'T',
        'hora_ingreso' => '14:00:00',
        'hora_salida' => '18:00:00',
        'minutos_tolerancia' => 15
    ]);

    echo "✅ Horarios creados: Mañana (ID {$horarioM->horario_id}), Tarde (ID {$horarioT->horario_id})\n";

    // Contrato con descuento proporcional
    $contrato = RhContrato::create([
        'user_id' => $user->id,
        'insti_id' => $instiId,
        'tipo_contrato' => 'tiempo_completo',
        'sueldo_base' => 1200,
        'horas_semanales' => 48,
        'descuento_por_tardanza' => 0, // No se usa en proporcional, se calcula por hora
        'tipo_descuento' => 'proporcional',
        'fecha_inicio' => now()->subMonth(),
        'estado' => 'activo'
    ]);

    echo "✅ Contrato creado: S/ 1200, 48h/sem, tipo PROPORCIONAL\n";

    $service = app(RhAsistenciaPersonalService::class);

    // 2. Simular ENTRADA CON TARDANZA (08:15)
    echo "\n--- Simulando Entrada a las 08:15 (Tolerancia 10m) ---\n";
    Carbon::setTestNow(Carbon::today()->setHour(8)->setMinute(15));
    
    $asistencia = $service->registrarEntrada($user->id, $instiId);

    echo "Resultado:\n";
    echo "- Horario Resuelto: " . ($asistencia->horario->turno === 'M' ? 'Mañana (CORRECTO)' : 'OTRO (ERROR)') . "\n";
    echo "- Minutos Tardanza: {$asistencia->minutos_tardanza} (Esperado: 15)\n";
    echo "- Descuento Entrada: S/ {$asistencia->descuento_aplicado}\n";

    // Verificación manual del cálculo: 
    // 1200 / (48 * 4 * 60) = 1200 / 11520 = 0.10416... por min
    // 15 * 0.10416 = 1.56
    if (abs($asistencia->descuento_aplicado - 1.56) < 0.05) {
        echo "✅ Descuento de entrada calculado correctamente.\n";
    } else {
        echo "❌ Error en cálculo de descuento de entrada. Recibido: {$asistencia->descuento_aplicado}, Esperado: ~1.56\n";
    }

    // 3. Simular SALIDA ANTICIPADA (12:30)
    echo "\n--- Simulando Salida a las 12:30 (Salida esperada 13:00) ---\n";
    Carbon::setTestNow(Carbon::today()->setHour(12)->setMinute(30));

    $asistencia = $service->registrarSalida($user->id);

    echo "Resultado:\n";
    echo "- Minutos Salida Anticipada: {$asistencia->minutos_salida_anticipada} (Esperado: 30)\n";
    echo "- Descuento Total Acumulado: S/ {$asistencia->descuento_aplicado}\n";

    // Verificación manual del cálculo total:
    // Tardanza (15m) + Salida (30m) = 45m
    // 45 * 0.10416 = 4.6875 -> ~4.69
    if (abs($asistencia->descuento_aplicado - 4.69) < 0.05) {
        echo "✅ Descuento total calculado correctamente.\n";
    } else {
        echo "❌ Error en cálculo de descuento total. Recibido: {$asistencia->descuento_aplicado}, Esperado: ~4.69\n";
    }

    echo "\n--- TEST FINALIZADO CON ÉXITO ---\n";

} catch (\Exception $e) {
    echo "\n❌ ERROR DURANTE EL TEST: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
} finally {
    DB::rollBack();
    Carbon::setTestNow(); // Reset time
    echo "--- Base de datos revertida ---\n";
}
