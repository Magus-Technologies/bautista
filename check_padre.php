<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$padre = DB::table('padre_apoderado')
    ->where('id_contacto', 1246)
    ->first();

echo "Padre: " . json_encode($padre, JSON_PRETTY_PRINT) . PHP_EOL;
