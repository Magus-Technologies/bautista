<?php

namespace App\Jobs;

use App\Models\Estudiante;
use App\Models\InstitucionEducativa;
use App\Models\Pago;
use App\Services\Interfaces\WhatsAppServiceInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Avisa por WhatsApp a los apoderados de un alumno con pagos vencidos.
 *
 * Va un mensaje por alumno con el detalle de todo lo pendiente, no uno por
 * cuota: un apoderado que debe cuatro meses recibiría cuatro mensajes
 * seguidos, que es justo el patrón que satura al padre y quema el número.
 *
 * Deja constancia en pago_avisos_whatsapp para no repetir el aviso en la
 * corrida del día siguiente.
 */
class NotificarPagoVencido implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 60;

    /**
     * @param  array<int>  $pagoIds
     */
    public function __construct(
        private readonly int $estudianteId,
        private readonly array $pagoIds,
    ) {}

    public function handle(WhatsAppServiceInterface $whatsapp): void
    {
        // Alguno pudo pagarse entre que se encoló el aviso y que corrió el worker.
        $pagos = Pago::whereIn('pag_id', $this->pagoIds)
            ->where('estatus', 0)
            ->get();

        if ($pagos->isEmpty()) {
            return;
        }

        $estudiante = Estudiante::with(['perfil', 'contactos'])->find($this->estudianteId);

        if (! $estudiante) {
            return;
        }

        $contactos = $estudiante->contactos->filter(
            fn ($c) => filled($c->telefono_1) || filled($c->telefono_2)
        );

        if ($contactos->isEmpty()) {
            Log::info('Pagos vencidos: el alumno no tiene apoderados con teléfono', [
                'estu_id' => $this->estudianteId,
                'alumno' => $estudiante->nombre_completo,
            ]);

            return;
        }

        $mensaje = $this->construirMensaje($pagos, $estudiante);

        foreach ($contactos as $contacto) {
            $telefono = filled($contacto->telefono_1)
                ? $contacto->telefono_1
                : $contacto->telefono_2;

            if (! $whatsapp->enviar($telefono, $mensaje)) {
                continue;
            }

            $this->registrarEnvio($pagos, $telefono);
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Pago>  $pagos
     */
    private function construirMensaje($pagos, Estudiante $estudiante): string
    {
        $colegio = InstitucionEducativa::query()
            ->where('insti_id', $pagos->first()->insti_id)
            ->value('insti_razon_social') ?? 'La institución';

        $total = 0.0;
        $detalle = '';

        foreach ($pagos as $pago) {
            $monto = (float) ($pago->total ?: $pago->pag_monto);
            $total += $monto;

            $periodo = trim(($pago->pag_mes ?? '').' '.($pago->pag_anual ?? ''));
            $etiqueta = $periodo !== '' ? $periodo : 'Pago pendiente';

            $detalle .= '• '.$etiqueta.': S/ '.number_format($monto, 2)."\n";
        }

        $plural = $pagos->count() === 1 ? 'un pago pendiente' : 'pagos pendientes';

        return "*{$colegio}*\n\n"
            ."Estimado apoderado, le informamos que *{$estudiante->nombre_completo}* "
            ."registra {$plural}:\n\n"
            .$detalle."\n"
            .'*Total: S/ '.number_format($total, 2)."*\n\n"
            ."Si ya realizó el pago, haga caso omiso a este mensaje.\n\n"
            .'_Mensaje automático, por favor no responder._';
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Pago>  $pagos
     */
    private function registrarEnvio($pagos, string $telefono): void
    {
        $ahora = now();

        DB::table('pago_avisos_whatsapp')->insert(
            $pagos->map(fn ($pago) => [
                'pag_id' => $pago->pag_id,
                'telefono' => $telefono,
                'dias_vencido' => 0,
                'enviado_en' => $ahora,
            ])->all()
        );
    }
}
