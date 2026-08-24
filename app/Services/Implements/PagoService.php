<?php

namespace App\Services\Implements;

use App\Models\Pago;
use App\Models\PagoNotifica;
use App\Repositories\Interfaces\PagoNotificaRepositoryInterface;
use App\Repositories\Interfaces\PagoRepositoryInterface;
use App\Repositories\Interfaces\PadreRepositoryInterface;
use App\Services\ActividadUsuarioService;
use App\Services\Interfaces\PagoServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PagoService implements PagoServiceInterface
{
    public function __construct(
        private readonly PagoRepositoryInterface $repo,
        private readonly PagoNotificaRepositoryInterface $notificaRepo,
        private readonly PadreRepositoryInterface $padreRepo,
        private readonly ActividadUsuarioService $auditoria,
    ) {}

    // ── Listados ──────────────────────────────────────────────────────────

    public function listarEstudiantesConPagador(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        return $this->repo->paginateEstudiantesConPagador($instiId, $search, $perPage);
    }

    public function listarPagadores(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        return $this->padreRepo->paginatePagadores($instiId, $search, $perPage);
    }

    public function pagosPorContacto(int $contactoId, ?int $conceptoId = null): Collection
    {
        return $this->repo->pagosPorContacto($contactoId, $conceptoId);
    }

    // ── CRUD ──────────────────────────────────────────────────────────────

    public function crearPago(array $data): Pago
    {
        if (isset($data['estudiante_id']) && !isset($data['estu_id'])) {
            $data['estu_id'] = $data['estudiante_id'];
        }
        unset($data['estudiante_id']);

        // Validar restricción de conceptos únicos
        if (isset($data['concepto_id']) && $data['concepto_id']) {
            $this->validarConceptoUnicoAlAgregar((int)$data['estu_id'], (int)$data['concepto_id'], (int)$data['pag_anual']);
        }

        // total = monto principal + conceptos adicionales legacy
        $data['total']   = ($data['pag_monto'] ?? 0) + ($data['pag_otro1'] ?? 0) + ($data['pag_otro2'] ?? 0);
        $data['estatus'] = 0;

        $pago = $this->repo->create($data);
        $this->auditoria->registrar('crear', 'Pago', $pago->pag_id, "Pago registrado: S/ {$pago->total}");
        return $pago;
    }

    public function actualizarPago(int $id, array $data): Pago
    {
        $pago = $this->repo->findById($id);
        $data['total'] = ($data['pag_monto'] ?? $pago->pag_monto)
                       + ($data['pag_otro1'] ?? $pago->pag_otro1 ?? 0)
                       + ($data['pag_otro2'] ?? $pago->pag_otro2 ?? 0);
        unset($data['estatus']);

        $updated = $this->repo->update($pago, $data);
        $this->auditoria->registrar('actualizar', 'Pago', $id, "Pago actualizado: S/ {$updated->total}");
        return $updated;
    }

    public function eliminarPago(int $id): void
    {
        $pago = $this->repo->findById($id);
        $this->auditoria->registrar('eliminar', 'Pago', $id, "Pago eliminado: S/ {$pago->total}");
        $this->repo->delete($pago);
    }

    // ── Dashboard / Reportes ──────────────────────────────────────────────

    public function dashboard(int $instiId, string $mes, int $anio): array
    {
        return $this->repo->dashboard($instiId, $mes, $anio);
    }

    public function vencidos(int $instiId, int $diasGracia = 30): Collection
    {
        return $this->repo->vencidos($instiId, $diasGracia);
    }

    public function historialAlumno(int $instiId, int $estuId): array
    {
        return $this->repo->historialAlumno($instiId, $estuId);
    }

    public function reporteConsolidado(int $instiId, string $mes, int $anio): array
    {
        return $this->repo->reporteConsolidado($instiId, $mes, $anio);
    }

    // ── Generación masiva de mensualidades ────────────────────────────────

    /**
     * Genera pagos mensuales para todos los alumnos activos.
     * Itera sobre cada concepto de periodicidad "mensual" activo,
     * creando 1 registro por alumno × concepto.
     */
    public function generarMensualidades(int $instiId, string $mes, int $anio): array
    {
        $today      = now()->toDateString();
        $numMes     = $this->getNumeroMes($mes);
        $estudiantes = $this->repo->getEstudiantesParaGeneracion($instiId, $anio);

        $conceptosMensuales = DB::table('concepto_pago')
            ->where('insti_id', $instiId)
            ->where('periodicidad', 'mensual')
            ->where('activo', 1)
            ->get();

        $creados = 0; $omitidos = 0;

        foreach ($estudiantes as $est) {
            foreach ($conceptosMensuales as $concepto) {
                // Evitar duplicado: alumno + concepto + mes + año
                if ($this->repo->existePago($est->estu_id, $mes, $anio, $concepto->concepto_id)) {
                    $omitidos++; continue;
                }

                $monto = $this->repo->getMontoTarifa($instiId, $est->grado_id, $anio, 'mensual', $est->nivel_id)
                    ?? (float)($est->mensualidad ?? 0);

                [$montoFinal, $obs] = $this->aplicarDescuentos(
                    $est->estu_id, $monto, $today,
                    $concepto->concepto_id, $est->nivel_id, $est->grado_id
                );

                $this->repo->create([
                    'insti_id'    => $instiId,
                    'estu_id'     => $est->estu_id,
                    'contacto_id' => $est->contacto_id,
                    'concepto_id' => $concepto->concepto_id,
                    'pag_anual'   => $anio,
                    'pag_mes'     => $mes,
                    'pag_monto'   => $montoFinal,
                    'total'       => $montoFinal,
                    'estatus'     => 0,
                    'pag_fecha'   => $this->calcularFechaVencimiento($anio, $numMes, $est->dia_pago),
                    'observacion' => $obs,
                ]);
                $creados++;
            }
        }

        $this->auditoria->registrar('generar_mensualidades', 'Pago', 0, "Mensualidades {$mes} {$anio}: {$creados} creadas.");
        return ['creados' => $creados, 'omitidos' => $omitidos, 'total' => $estudiantes->count()];
    }

    /**
     * Genera mensualidades para un alumno individual.
     * Crea 1 registro por cada concepto mensual activo.
     */
    public function generarMensualidadAlumno(int $instiId, int $estuId, string $mes, int $anio): array
    {
        $est = $this->repo->getEstudiantesParaGeneracion($instiId, $anio)->firstWhere('estu_id', $estuId);
        if (!$est) return ['status' => 'error', 'message' => 'Estudiante no encontrado'];

        $conceptosMensuales = DB::table('concepto_pago')
            ->where('insti_id', $instiId)
            ->where('periodicidad', 'mensual')
            ->where('activo', 1)
            ->get();

        if ($conceptosMensuales->isEmpty()) {
            return ['status' => 'error', 'message' => 'No hay conceptos mensuales configurados'];
        }

        $creados = 0; $omitidos = 0; $pagosCreados = [];

        foreach ($conceptosMensuales as $concepto) {
            if ($this->repo->existePago($estuId, $mes, $anio, $concepto->concepto_id)) {
                $omitidos++; continue;
            }

            $monto = $this->repo->getMontoTarifa($instiId, $est->grado_id, $anio, 'mensual', $est->nivel_id)
                ?? (float)($est->mensualidad ?? 0);

            [$montoFinal, $obs] = $this->aplicarDescuentos(
                $estuId, $monto, now()->toDateString(),
                $concepto->concepto_id, $est->nivel_id, $est->grado_id
            );

            $pago = $this->repo->create([
                'insti_id'    => $instiId,
                'estu_id'     => $estuId,
                'contacto_id' => $est->contacto_id,
                'concepto_id' => $concepto->concepto_id,
                'pag_anual'   => $anio,
                'pag_mes'     => $mes,
                'pag_monto'   => $montoFinal,
                'total'       => $montoFinal,
                'estatus'     => 0,
                'pag_fecha'   => $this->calcularFechaVencimiento($anio, $this->getNumeroMes($mes), $est->dia_pago),
                'observacion' => $obs,
            ]);
            $pagosCreados[] = $pago;
            $creados++;
        }

        if ($creados === 0) {
            return ['status' => 'exists', 'message' => 'Ya existen mensualidades para este período'];
        }

        $this->auditoria->registrar('generar_mensualidad_individual', 'Pago', 0, "{$creados} mensualidad(es) generada(s).");
        return ['status' => 'success', 'creados' => $creados, 'omitidos' => $omitidos, 'pagos' => $pagosCreados];
    }

    /**
     * Genera los pagos de conceptos único/anual al matricular un alumno.
     * pag_mes = null porque no son mensualidades.
     * 
     * RESTRICCIÓN: Si hay concepto único, no se pueden agregar otros conceptos.
     */
    public function generarPagosMatricula(int $instiId, int $estuId, int $contactoId, int $anio, array $conceptos): array
    {
        // Validar restricción de conceptos únicos
        $this->validarConceptosUnicos($conceptos);

        $today   = now()->toDateString();
        $creados = 0;

        $est = $this->repo->getEstudiantesParaGeneracion($instiId, $anio)->firstWhere('estu_id', $estuId);

        foreach ($conceptos as $c) {
            $montoOriginal = (float) $c['monto'];
            $conceptoId    = isset($c['id']) ? (int) $c['id'] : null;

            // Evitar duplicado: mismo alumno + mismo concepto + mismo año
            if ($conceptoId && $this->repo->existePagoConcepto($estuId, $anio, $conceptoId)) {
                continue;
            }

            [$montoFinal, $obs] = $this->aplicarDescuentos(
                $estuId, $montoOriginal, $today,
                $conceptoId, $est?->nivel_id, $est?->grado_id
            );

            $this->repo->create([
                'insti_id'    => $instiId,
                'estu_id'     => $estuId,
                'contacto_id' => $contactoId,
                'concepto_id' => $conceptoId,
                'pag_anual'   => $anio,
                'pag_mes'     => null,       // único/anual no tiene mes
                'pag_monto'   => $montoFinal,
                'total'       => $montoFinal,
                'estatus'     => 0,
                'pag_fecha'   => $today,
                'observacion' => $obs,
            ]);
            $creados++;
        }

        $this->auditoria->registrar('generar_pagos_matricula', 'Pago', 0, "{$creados} conceptos de matrícula generados para Estu ID {$estuId}");
        return ['creados' => $creados];
    }

    public function sincronizarPagos(int $instiId, int $estuId, int $anio): array
    {
        // 1. Obtener datos de matricula/estudiante para saber nivel/grado
        $est = $this->repo->getEstudiantesParaGeneracion($instiId, $anio)->firstWhere('estu_id', $estuId);
        if (!$est) return ['status' => 'error', 'message' => 'Estudiante no matriculado en este año'];

        // 2. Obtener todas las tarifas activas para este nivel/grado/año
        $tarifas = DB::table('tarifa_pago')
            ->where('insti_id', $instiId)
            ->where('anio_escolar', $anio)
            ->where('activo', 1)
            ->where(function($q) use ($est) {
                $q->where('grado_id', $est->grado_id)
                  ->orWhere(function($sq) use ($est) {
                      $sq->whereNull('grado_id')->where('nivel_id', $est->nivel_id);
                  })
                  ->orWhere(function($sq) {
                      $sq->whereNull('grado_id')->whereNull('nivel_id');
                  });
            })
            ->get();

        $creados = 0;
        $omitidos = 0;

        foreach ($tarifas as $tarifa) {
            $concepto = DB::table('concepto_pago')->where('concepto_id', $tarifa->concepto_id)->first();
            if (!$concepto || !$concepto->activo) continue;

            // Si es mensual, generar para todos los meses que falten (desde Marzo hasta Diciembre)
            if ($concepto->periodicidad === 'mensual') {
                $meses = ['MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
                foreach ($meses as $mes) {
                    if (!$this->repo->existePago($estuId, $mes, $anio, $concepto->concepto_id)) {
                        $this->crearPagoPendiente($instiId, $est, $concepto, $tarifa->monto, $mes, $anio);
                        $creados++;
                    } else {
                        $omitidos++;
                    }
                }
            } else {
                // Anual o Único
                if (!$this->repo->existePagoConcepto($estuId, $anio, $concepto->concepto_id)) {
                    $this->crearPagoPendiente($instiId, $est, $concepto, $tarifa->monto, null, $anio);
                    $creados++;
                } else {
                    $omitidos++;
                }
            }
        }

        return ['status' => 'success', 'creados' => $creados, 'omitidos' => $omitidos];
    }

    private function crearPagoPendiente(int $instiId, $est, $concepto, $montoOriginal, $mes, $anio)
    {
        [$montoFinal, $obs] = $this->aplicarDescuentos(
            $est->estu_id, (float)$montoOriginal, now()->toDateString(),
            $concepto->concepto_id, $est->nivel_id, $est->grado_id
        );

        return $this->repo->create([
            'insti_id'    => $instiId,
            'estu_id'     => $est->estu_id,
            'contacto_id' => $est->contacto_id,
            'concepto_id' => $concepto->concepto_id,
            'pag_anual'   => $anio,
            'pag_mes'     => $mes,
            'pag_monto'   => $montoFinal,
            'total'       => $montoFinal,
            'estatus'     => 0,
            'pag_fecha'   => $mes ? $this->calcularFechaVencimiento($anio, $this->getNumeroMes($mes), $est->dia_pago) : now(),
            'observacion' => $obs,
        ]);
    }

    public function obtenerMontoSugerido(int $instiId, int $estuId, int $anio): array
    {
        $est = $this->repo->getEstudiantesParaGeneracion($instiId, $anio)->firstWhere('estu_id', $estuId);
        if (!$est) return ['monto_base' => 0, 'monto_final' => 0, 'observacion' => 'No encontrado'];

        $conceptoId = DB::table('concepto_pago')
            ->where('insti_id', $instiId)
            ->where('periodicidad', 'mensual')
            ->where('activo', 1)
            ->value('concepto_id');

        $montoBase = $this->repo->getMontoTarifa($instiId, $est->grado_id, $anio, 'mensual', $est->nivel_id)
            ?? (float)($est->mensualidad ?? 0);

        [$montoFinal, $obs] = $this->aplicarDescuentos(
            $estuId, $montoBase, now()->toDateString(),
            $conceptoId, $est->nivel_id, $est->grado_id
        );

        return ['monto_base' => $montoBase, 'monto_final' => $montoFinal, 'observacion' => $obs];
    }

    // ── Vouchers / Notificaciones ─────────────────────────────────────────

    public function subirVoucher(int $pagoId, int $userId, UploadedFile $archivo): PagoNotifica
    {
        $path     = $archivo->store('vouchers', 'public');
        $notifica = $this->notificaRepo->create([
            'pag_id'  => $pagoId,
            'user_id' => $userId,
            'archivo' => $path,
            'estado'  => 'Pendiente',
        ]);
        $this->auditoria->registrar('subir_voucher', 'PagoNotifica', $notifica->id, "Voucher cargado.");
        return $notifica;
    }

    public function listarVouchers(int $pagoId): Collection
    {
        return $this->notificaRepo->porPago($pagoId);
    }

    public function validarVoucher(int $notificaId, string $estado, ?string $comentario): PagoNotifica
    {
        $notifica = $this->notificaRepo->findById($notificaId);
        $updated  = $this->notificaRepo->actualizarEstado($notifica, $estado, $comentario);

        if ($estado === 'validado') {
            $pago = $this->repo->findById($notifica->pag_id);
            if ($pago->estatus !== 1) $this->repo->update($pago, ['estatus' => 1]);
        }

        $this->auditoria->registrar('validar_voucher', 'PagoNotifica', $notificaId, "Voucher procesado: {$estado}");
        return $updated;
    }

    // ── Helpers privados ──────────────────────────────────────────────────

    /**
     * Aplica los descuentos vigentes al monto base.
     * Retorna [montoFinal, descripcionDescuentos|null].
     */
    private function aplicarDescuentos(int $estuId, float $monto, string $fecha, ?int $conceptoId, ?int $nivelId = null, ?int $gradoId = null): array
    {
        $descuentos = $this->repo->getDescuentosEstudiante($estuId, $fecha, $conceptoId, $nivelId, $gradoId);
        if ($descuentos->isEmpty()) return [$monto, null];

        $montoOriginal = $monto;
        $detalles      = [];

        foreach ($descuentos as $d) {
            $desc   = ($d->tipo === 'porcentaje')
                ? round($montoOriginal * ($d->valor / 100), 2)
                : min((float) $d->valor, $monto);
            $monto  = max($monto - $desc, 0);
            $detalles[] = $d->tipo === 'porcentaje'
                ? "Desc. {$d->motivo} {$d->valor}% (-S/ {$desc})"
                : "Desc. {$d->motivo} (-S/ {$desc})";
        }

        return [$monto, implode(', ', $detalles)];
    }

    private function getNumeroMes(string $mes): int
    {
        $map = [
            'ENERO'=>1,'FEBRERO'=>2,'MARZO'=>3,'ABRIL'=>4,
            'MAYO'=>5,'JUNIO'=>6,'JULIO'=>7,'AGOSTO'=>8,
            'SEPTIEMBRE'=>9,'OCTUBRE'=>10,'NOVIEMBRE'=>11,'DICIEMBRE'=>12,
        ];
        return $map[$mes] ?? (int) now()->month;
    }

    private function calcularFechaVencimiento(int $anio, int $mes, ?int $dia): string
    {
        $ultimo = cal_days_in_month(CAL_GREGORIAN, $mes, $anio);
        $dia    = min($dia ?? 1, $ultimo);
        return sprintf('%04d-%02d-%02d', $anio, $mes, $dia);
    }

    /**
     * Valida que no haya múltiples conceptos únicos.
     * Si hay concepto único, no se pueden agregar otros conceptos.
     * 
     * @throws \Exception
     */
    private function validarConceptosUnicos(array $conceptos): void
    {
        if (empty($conceptos)) return;

        // Obtener IDs de conceptos
        $conceptoIds = collect($conceptos)
            ->filter(fn($c) => isset($c['id']))
            ->map(fn($c) => (int)$c['id'])
            ->filter(fn($id) => $id > 0)
            ->toArray();

        if (empty($conceptoIds)) return;

        // Obtener conceptos únicos de BD
        $conceptosUnicos = DB::table('concepto_pago')
            ->whereIn('concepto_id', $conceptoIds)
            ->where('periodicidad', 'unico')
            ->pluck('concepto_id')
            ->toArray();

        // Si hay concepto único, validar restricciones
        if (!empty($conceptosUnicos)) {
            // No se pueden agregar múltiples conceptos únicos
            if (count($conceptosUnicos) > 1) {
                throw new \Exception('No se pueden agregar múltiples conceptos únicos. Solo se permite 1 concepto único por alumno.');
            }

            // Si hay concepto único, no se pueden agregar otros conceptos
            if (count($conceptos) > 1) {
                throw new \Exception('Si incluye un concepto único, no puede agregar otros conceptos. Los conceptos únicos son excluyentes.');
            }
        }
    }

    /**
     * Valida que al agregar un pago individual, se respete la restricción de conceptos únicos.
     * Si el concepto es único, no debe haber otros pagos del alumno en ese año.
     * Si hay otros pagos, no se puede agregar un concepto único.
     * 
     * @throws \Exception
     */
    private function validarConceptoUnicoAlAgregar(int $estuId, int $conceptoId, int $anio): void
    {
        // Obtener el concepto
        $concepto = DB::table('concepto_pago')
            ->where('concepto_id', $conceptoId)
            ->first();

        if (!$concepto) return;

        // Si el concepto es único
        if ($concepto->periodicidad === 'unico') {
            // Verificar si ya hay otros pagos del alumno en ese año
            $otrosPagos = DB::table('pagos')
                ->where('estu_id', $estuId)
                ->where('pag_anual', $anio)
                ->where('concepto_id', '!=', $conceptoId)
                ->exists();

            if ($otrosPagos) {
                throw new \Exception('No se puede agregar un concepto único si ya hay otros pagos. Los conceptos únicos son excluyentes.');
            }
        } else {
            // Si el concepto NO es único, verificar si hay concepto único existente
            $conceptoUnicoExistente = DB::table('pagos as p')
                ->join('concepto_pago as cp', 'p.concepto_id', '=', 'cp.concepto_id')
                ->where('p.estu_id', $estuId)
                ->where('p.pag_anual', $anio)
                ->where('cp.periodicidad', 'unico')
                ->exists();

            if ($conceptoUnicoExistente) {
                throw new \Exception('No se puede agregar más pagos. Ya existe un concepto único que es excluyente.');
            }
        }
    }
}
