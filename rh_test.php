<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\RhContrato;
use App\Models\RhAsistenciaPersonal;
use App\Models\RhNomina;
use App\Models\User;
use App\Models\Asistencia;

echo "--- CLEANING OLD TEST DATA ---\n";
RhAsistenciaPersonal::truncate();
RhNomina::truncate();
Asistencia::truncate();
echo "Data cleared.\n\n";

echo "--- TESTING REAL SYNC LOGIC (QR/DNI) ---\n";

$asistenciaGeneralService = app(App\Services\Interfaces\AsistenciaServiceInterface::class);

// Test data
$testUsers = [];
foreach ([205, 199] as $uId) {
    $p = \App\Models\Perfil::where('user_id', $uId)->first();
    if ($p) {
        $testUsers[] = ['uId' => $uId, 'dni' => $p->doc_numero, 'name' => "{$p->primer_nombre} {$p->apellido_paterno}"];
    }
}

foreach ($testUsers as $test) {
    echo "Marking attendance for {$test['name']} via DNI {$test['dni']}...\n";
    try {
        // We simulate a real mark at 07:45 (assuming entry is at 07:30)
        // To do this in a test script, we might need to mock 'now()' or just observe the result with current time
        $result = $asistenciaGeneralService->marcarPorDni($test['dni'], 'entrada');
        echo "Result: " . $result['message'] . " | Time: " . $result['hora'] . "\n";
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

echo "\n--- VERIFYING HR RECORDS ---\n";
$hrRecords = RhAsistenciaPersonal::all();
echo "HR Records found: " . $hrRecords->count() . " (Should NOT be 0 if sync works)\n";
foreach($hrRecords as $hr) {
    echo "- User: {$hr->user->nombre_completo} | Tardanza: {$hr->minutos_tardanza} | Descuento: {$hr->descuento_aplicado}\n";
}

// 1. Contratos
$contratos = RhContrato::with('user')->limit(5)->get();
echo "Contratos found: " . $contratos->count() . "\n";
foreach($contratos as $c) {
    echo "- ID: {$c->contrato_id} | UserID: {$c->user_id} | User: {$c->user->nombre_completo} | Sueldo Base: {$c->sueldo_base}\n";
}

// 2. Asistencia
$asistencias = RhAsistenciaPersonal::with('user')->limit(5)->get();
echo "\nAsistencias found: " . $asistencias->count() . "\n";
foreach($asistencias as $a) {
    echo "- ID: {$a->asistencia_personal_id} | User: {$a->user->nombre_completo} | Estado: {$a->estado} | Tardanza: {$a->minutos_tardanza}\n";
}

// 3. Nomina
$nominas = RhNomina::with('user')->limit(5)->get();
echo "\nNominas found: " . $nominas->count() . "\n";
foreach($nominas as $n) {
    echo "- ID: {$n->nomina_id} | User: {$n->user->nombre_completo} | Neto: {$n->sueldo_neto} | Estado: {$n->estado}\n";
}

echo "\n--- API Endpoints Logic Test ---\n";
// Test Reporte Periodo logic (without HTTP)
$service = app(App\Services\Interfaces\RhAsistenciaPersonalServiceInterface::class);
if ($contratos->count() > 0) {
    $uId = $contratos->first()->user_id;
    $reporte = $service->getReportePeriodo($uId, date('m'), date('Y'));
    echo "Reporte for User {$uId} (Period: " . date('m/Y') . "): Found " . count($reporte['asistencias']) . " records.\n";
    echo "Stats: Dias Presentes: {$reporte['estadisticas']['dias_presentes']}, Tardanzas: {$reporte['estadisticas']['total_tardanzas']}\n";
}

echo "\n--- TEST COMPLETE ---\n";
