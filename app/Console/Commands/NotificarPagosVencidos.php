<?php

namespace App\Console\Commands;

use App\Jobs\NotificarPagoVencido;
use App\Models\InstitucionEducativa;
use App\Services\Interfaces\PagoServiceInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class NotificarPagosVencidos extends Command
{
    protected $signature = 'pagos:notificar-vencidos
                            {--forzar : Ignora el intervalo y reenvía aunque ya se haya avisado}
                            {--simular : Muestra a quién se avisaría, sin enviar nada}';

    protected $description = 'Avisa por WhatsApp a los apoderados con pagos vencidos';

    public function handle(PagoServiceInterface $pagos): int
    {
        $graciaDias = (int) config('whatsapp.pagos.dias_gracia');
        $intervalo = (int) config('whatsapp.pagos.dias_entre_avisos');
        $simular = $this->option('simular');

        if (! config('whatsapp.pagos.notificar_vencidos') && ! $simular) {
            $this->warn('Los avisos de pagos vencidos están desactivados en la configuración.');

            return self::SUCCESS;
        }

        $encolados = 0;
        $omitidos = 0;

        foreach (InstitucionEducativa::pluck('insti_id') as $instiId) {
            // Un mensaje por alumno con todo lo que debe, no uno por cuota.
            $porAlumno = $pagos->vencidos($instiId, $graciaDias)
                ->filter(function ($pago) use ($intervalo, &$omitidos) {
                    $monto = (float) ($pago->total ?: $pago->pag_monto);

                    // Registros en cero: no hay deuda que cobrar.
                    if ($monto <= 0) {
                        return false;
                    }

                    if (! $this->option('forzar') && $this->yaAvisado($pago->pag_id, $intervalo)) {
                        $omitidos++;

                        return false;
                    }

                    return true;
                })
                ->groupBy('estu_id');

            foreach ($porAlumno as $estuId => $suyos) {
                $total = $suyos->sum(fn ($p) => (float) ($p->total ?: $p->pag_monto));

                if ($simular) {
                    $this->line(sprintf(
                        '  Alumno %d · %d cuota(s) · S/ %s',
                        $estuId,
                        $suyos->count(),
                        number_format($total, 2)
                    ));
                    $encolados++;

                    continue;
                }

                NotificarPagoVencido::dispatch((int) $estuId, $suyos->pluck('pag_id')->all());
                $encolados++;
            }
        }

        $this->info($simular
            ? "Simulación: {$encolados} avisos se enviarían, {$omitidos} omitidos por intervalo."
            : "{$encolados} avisos encolados, {$omitidos} omitidos por intervalo.");

        return self::SUCCESS;
    }

    /**
     * ¿Ya se avisó de este pago dentro del intervalo configurado?
     */
    private function yaAvisado(int $pagoId, int $intervalo): bool
    {
        return DB::table('pago_avisos_whatsapp')
            ->where('pag_id', $pagoId)
            ->where('enviado_en', '>=', now()->subDays($intervalo))
            ->exists();
    }
}
