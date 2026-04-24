<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== VERIFICANDO HORARIOS Y USUARIOS ===\n\n";

// Verificar horarios disponibles
$horarios = App\Models\HorarioAsistencia::all();
echo "Total de horarios: " . $horarios->count() . "\n";
foreach ($horarios as $h) {
    echo "  - ID: {$h->horario_id} | Tipo: {$h->tipo_usuario} | Rol ID: {$h->rol_id} | {$h->hora_ingreso}-{$h->hora_salida} | Tolerancia: {$h->minutos_tolerancia}min\n";
}

echo "\n=== VERIFICANDO USUARIOS CON ROL ===\n\n";

// Verificar usuarios con rol
$users = App\Models\User::with(['rol'])->whereNotNull('rol_id')->take(5)->get();
echo "Usuarios con rol: " . $users->count() . "\n";
foreach ($users as $user) {
    echo "\nUsuario: {$user->name}\n";
    echo "  Rol ID: {$user->rol_id}\n";
    echo "  Rol: " . ($user->rol ? $user->rol->name : 'Sin rol') . "\n";
    
    // Intentar obtener horario
    $horario = App\Models\HorarioAsistencia::where('rol_id', $user->rol_id)
        ->where('tipo_usuario', 'T')
        ->first();
    
    if ($horario) {
        echo "  ✓ Tiene horario: {$horario->hora_ingreso}-{$horario->hora_salida} (Tolerancia: {$horario->minutos_tolerancia}min)\n";
    } else {
        echo "  ✗ NO tiene horario configurado\n";
    }
}

echo "\n=== VERIFICANDO CONTRATOS ===\n\n";

$contratos = App\Models\RhContrato::with(['user.rol', 'user.horarioAsistencia'])->take(3)->get();
echo "Contratos: " . $contratos->count() . "\n";
foreach ($contratos as $contrato) {
    echo "\nContrato ID: {$contrato->contrato_id}\n";
    echo "  Usuario: {$contrato->user->name}\n";
    echo "  Rol ID: {$contrato->user->rol_id}\n";
    echo "  Horario cargado: " . ($contrato->user->horarioAsistencia ? 'SÍ' : 'NO') . "\n";
    if ($contrato->user->horarioAsistencia) {
        echo "  Hora: {$contrato->user->horarioAsistencia->hora_ingreso}-{$contrato->user->horarioAsistencia->hora_salida}\n";
    }
}
