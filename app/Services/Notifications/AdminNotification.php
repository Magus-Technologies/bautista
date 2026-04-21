<?php

namespace App\Services\Notifications;

use App\Models\Matricula;
use App\Models\Pago;
use App\Models\PagoNotifica;
use App\Models\Perfil;
use App\Models\User;
use App\Services\Notifications\Shared\MensajesNotification;
use Illuminate\Support\Carbon;

class AdminNotification
{
    public function __construct(private MensajesNotification $mensajes) {}

    public function build(User $user, int $instiId): array
    {
        $notifications = $this->mensajes->sinLeer($user);
        $now           = Carbon::now();

        $vouchers = PagoNotifica::where('estado', 'pendiente')->count();
        if ($vouchers > 0) {
            $s = $vouchers > 1;
            $notifications[] = [
                'id'      => 'vouchers_pendientes',
                'type'    => 'warning',
                'title'   => 'Vouchers por validar',
                'message' => "Hay {$vouchers} comprobante" . ($s ? 's' : '') . " pendiente" . ($s ? 's' : '') . " de validar.",
                'link'    => '/pagos',
            ];
        }

        $matriculasHoy = Matricula::whereHas('apertura', fn($q) => $q->where('insti_id', $instiId))
            ->whereDate('created_at', $now->toDateString())
            ->count();
        if ($matriculasHoy > 0) {
            $s = $matriculasHoy > 1;
            $notifications[] = [
                'id'      => 'matriculas_hoy',
                'type'    => 'info',
                'title'   => 'Nuevas matrículas',
                'message' => "Hoy se registraron {$matriculasHoy} nueva" . ($s ? 's' : '') . " matrícula" . ($s ? 's' : '') . ".",
                'link'    => '/matriculas/gestion',
            ];
        }

        // Solo los campos necesarios para armar el mensaje
        $birthdays = Perfil::select('perfil_id', 'primer_nombre', 'apellido_paterno', 'user_id')
            ->whereHas('user', fn($q) => $q->where('insti_id', $instiId))
            ->whereMonth('fecha_nacimiento', $now->month)
            ->whereDay('fecha_nacimiento', $now->day)
            ->get();
        if ($birthdays->isNotEmpty()) {
            $names = $birthdays->map(fn($p) => "{$p->primer_nombre} {$p->apellido_paterno}")->take(3)->join(', ');
            $extra = $birthdays->count() > 3 ? ' y ' . ($birthdays->count() - 3) . ' más' : '';
            $notifications[] = [
                'id'      => 'birthdays',
                'type'    => 'success',
                'title'   => 'Cumpleaños de hoy',
                'message' => "Hoy cumplen años: {$names}{$extra}.",
                'link'    => '/estudiantes',
            ];
        }

        $pagos = Pago::where('insti_id', $instiId)->where('estatus', 0)->count();
        if ($pagos > 0) {
            $s = $pagos > 1;
            $notifications[] = [
                'id'      => 'pagos_pendientes',
                'type'    => 'warning',
                'title'   => 'Pagos pendientes',
                'message' => "Hay {$pagos} pago" . ($s ? 's' : '') . " pendiente" . ($s ? 's' : '') . " de cobro.",
                'link'    => '/pagos',
            ];
        }

        return $notifications;
    }
}
