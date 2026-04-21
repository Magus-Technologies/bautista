<?php

namespace App\Services\Notifications\Shared;

use App\Models\MensajePrivado;
use App\Models\User;

class MensajesNotification
{
    public function sinLeer(User $user): array
    {
        $count = MensajePrivado::where('destinatario_id', $user->id)
            ->where('leido_destinatario', false)
            ->where('eliminado_destinatario', false)
            ->count();

        if ($count === 0) return [];

        return [[
            'id'      => 'mensajes_sin_leer',
            'type'    => 'info',
            'title'   => 'Mensajes sin leer',
            'message' => "Tienes {$count} mensaje" . ($count > 1 ? 's' : '') . " sin leer.",
            'link'    => '/mensajeria',
        ]];
    }
}
