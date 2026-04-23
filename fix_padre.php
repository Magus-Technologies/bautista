<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

DB::table('padre_apoderado')
    ->where('id_contacto', 1246)
    ->update(['es_pagador' => '1']);

echo "✅ Padre actualizado: es_pagador = '1'\n";
echo "Ahora debería aparecer en http://127.0.0.1:8000/pagos\n";
