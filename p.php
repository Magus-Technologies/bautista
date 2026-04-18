<?php
$BASE = 'http://localhost:8000/api';
$USER = 'admin';
$PASS = 'admin123';

function req($url, $method = 'GET', $data = null, $token = '') {
    $ch = curl_init($url);
    $h = ['Content-Type: application/json', 'Accept: application/json'];
    if ($token) $h[] = "Authorization: Bearer $token";
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $h,
        CURLOPT_POSTFIELDS     => $data ? json_encode($data) : null,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $t = microtime(true);
    $b = curl_exec($ch);
    $ms = round((microtime(true)-$t)*1000,1);
    $c = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['ms'=>$ms,'code'=>$c,'data'=>json_decode($b,true)];
}

function line($label, $ms, $code) {
    $b = $ms<200?'RAPIDO':($ms<500?'NORMAL':($ms<1000?'LENTO ':'MUY LENTO'));
    $ok = ($code>=200&&$code<300)?'OK':'FAIL';
    echo "  [$b] $label => {$ms}ms [$ok $code]\n";
}

echo "\n=== TEST VELOCIDAD (CACHE=FILE, SESSION=FILE) " . date('H:i:s') . " ===\n\n";

$r = req("$BASE/auth/login", 'POST', ['username'=>$USER,'password'=>$PASS,'device_name'=>'t']);
line('POST /auth/login', $r['ms'], $r['code']);
$token = $r['data']['token'] ?? '';
if (!$token) { echo "ERROR: sin token\n"; exit; }

echo "\n";
foreach ([
    '/dashboard/stats' => 'GET /dashboard/stats',
    '/niveles'         => 'GET /niveles',
    '/grados'          => 'GET /grados',
    '/secciones'       => 'GET /secciones',
    '/cursos'          => 'GET /cursos',
    '/docentes?per_page=20'    => 'GET /docentes',
    '/estudiantes?per_page=20' => 'GET /estudiantes',
    '/matriculas/aperturas'    => 'GET /matriculas/aperturas',
    '/auth/me'         => 'GET /auth/me',
] as $path => $label) {
    $r = req("$BASE$path", 'GET', null, $token);
    line($label, $r['ms'], $r['code']);
}

echo "\n--- RAPIDO<200ms | NORMAL 200-500ms | LENTO 500-1000ms ---\n\n";
