<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Servicio de WhatsApp (Baileys)
    |--------------------------------------------------------------------------
    |
    | Microservicio Node que corre en whatsapp-service/. Laravel solo le habla
    | por HTTP; toda la sesión de WhatsApp vive allá.
    |
    */

    'url' => env('WHATSAPP_URL', 'http://127.0.0.1:3333'),

    'token' => env('WHATSAPP_TOKEN', ''),

    'timeout' => env('WHATSAPP_TIMEOUT', 5),

    // Interruptor general. En local suele ir apagado para no enviar de verdad.
    'habilitado' => env('WHATSAPP_HABILITADO', false),

    'asistencia' => [
        // Avisar al marcar entrada / salida.
        'notificar_entrada' => env('WHATSAPP_NOTIFICAR_ENTRADA', true),
        'notificar_salida' => env('WHATSAPP_NOTIFICAR_SALIDA', true),
    ],
];
