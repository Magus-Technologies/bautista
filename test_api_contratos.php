<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== PROBANDO API DE CONTRATOS ===\n\n";

$contratos = App\Models\RhContrato::with(['user.perfil', 'user.horarioAsistencia'])->take(2)->get();

foreach ($contratos as $contrato) {
    $resource = new App\Http\Resources\RhContratoResource($contrato);
    $data = $resource->toArray(request());
    
    echo "Contrato ID: {$contrato->contrato_id}\n";
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    echo "\n\n";
}
