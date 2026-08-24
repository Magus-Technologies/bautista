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

    'pagos' => [
        // Interruptor de los avisos de morosidad.
        'notificar_vencidos' => env('WHATSAPP_NOTIFICAR_VENCIDOS', true),

        // Días de tolerancia tras el vencimiento antes del primer aviso.
        // 0 = avisar apenas se pasa la fecha.
        'dias_gracia' => env('WHATSAPP_PAGOS_DIAS_GRACIA', 0),

        // Cada cuántos días se reitera mientras siga sin pagar.
        // La tarea corre a diario; esto evita avisar todas las mañanas.
        'dias_entre_avisos' => env('WHATSAPP_PAGOS_DIAS_ENTRE_AVISOS', 7),

        // Hora de la corrida diaria.
        'hora_envio' => env('WHATSAPP_PAGOS_HORA', '09:00'),
    ],

    'asistencia' => [
        // Avisar al marcar entrada / salida.
        'notificar_entrada' => env('WHATSAPP_NOTIFICAR_ENTRADA', true),
        'notificar_salida' => env('WHATSAPP_NOTIFICAR_SALIDA', true),
    ],
];
