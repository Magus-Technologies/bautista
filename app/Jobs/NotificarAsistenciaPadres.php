<?php

namespace App\Jobs;

use App\Models\Estudiante;
use App\Models\InstitucionEducativa;
use App\Services\Interfaces\WhatsAppServiceInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Avisa por WhatsApp a los apoderados cuando un alumno marca entrada o salida.
 *
 * Va en cola para no demorar el escaneo del QR: el marcado responde de
 * inmediato y el envío ocurre después en segundo plano.
 */
class NotificarAsistenciaPadres implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(
        private readonly int $estudianteId,
        private readonly string $tipoMarcado,
        private readonly string $hora,
    ) {}

    public function handle(WhatsAppServiceInterface $whatsapp): void
    {
        $estudiante = Estudiante::with(['perfil', 'contactos'])->find($this->estudianteId);

        if (! $estudiante) {
            Log::warning('Asistencia: estudiante no encontrado para notificar', [
                'estu_id' => $this->estudianteId,
            ]);

            return;
        }

        $contactos = $estudiante->contactos->filter(
            fn ($contacto) => filled($contacto->telefono_1) || filled($contacto->telefono_2)
        );

        if ($contactos->isEmpty()) {
            Log::info('Asistencia: el alumno no tiene apoderados con teléfono', [
                'estu_id' => $this->estudianteId,
                'alumno' => $estudiante->nombre_completo,
            ]);

            return;
        }

        $mensaje = $this->construirMensaje($estudiante);

        foreach ($contactos as $contacto) {
            $telefono = filled($contacto->telefono_1)
                ? $contacto->telefono_1
                : $contacto->telefono_2;

            $whatsapp->enviar($telefono, $mensaje);
        }
    }

    private function construirMensaje(Estudiante $estudiante): string
    {
        $colegio = InstitucionEducativa::query()
            ->where('insti_id', $estudiante->insti_id)
            ->value('insti_razon_social') ?? 'La institución';

        $accion = $this->tipoMarcado === 'entrada'
            ? 'ingresó a'
            : 'salió de';

        $hora = Carbon::parse($this->hora)->format('h:i A');
        $fecha = now()->translatedFormat('d/m/Y');

        return "*{$colegio}*\n\n"
            ."Estimado apoderado, le informamos que su hijo(a) "
            ."*{$estudiante->nombre_completo}* {$accion} la institución.\n\n"
            ."Fecha: {$fecha}\n"
            ."Hora: {$hora}\n\n"
            .'_Mensaje automático, por favor no responder._';
    }
}
