<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Aviso diario de pagos vencidos. Se salta domingos: un recordatorio de
// cobranza en fin de semana molesta y nadie puede pagar ese día.
Schedule::command('pagos:notificar-vencidos')
    ->dailyAt(config('whatsapp.pagos.hora_envio'))
    ->days([1, 2, 3, 4, 5, 6])
    ->withoutOverlapping();
