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

    public function listarEstudiantesConPagador(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        return $this->repo->paginateEstudiantesConPagador($instiId, $search, $perPage);
    }

    public function listarPagadores(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        return $this->padreRepo->paginatePagadores($instiId, $search, $perPage);
    }

    public function pagosPorContacto(int $contactoId): Collection
    {
        return $this->repo->pagosPorContacto($contactoId);
    }

    public function crearPago(array $data): Pago
    {
        if (isset($data['estudiante_id']) && !isset($data['estu_id'])) {
            $data['estu_id'] = $data['estudiante_id'];
        }
        unset($data['estudiante_id']);

        $data['total'] = ($data['pag_monto'] ?? 0) + ($data['pag_otro1'] ?? 0) + ($data['pag_otro2'] ?? 0);
        $data['estatus'] = 0;

        $pago = $this->repo->create($data);
        $this->auditoria->registrar('crear', 'Pago', $pago->pag_id, "Pago registrado: S/ {$pago->total}");
        return $pago;
    }

    public function actualizarPago(int $id, array $data): Pago
    {
        $pago = $this->repo->findById($id);
        $data['total'] = ($data['pag_monto'] ?? $pago->pag_monto) + ($data['pag_otro1'] ?? $pago->pag_otro1) + ($data['pag_otro2'] ?? $pago->pag_otro2);
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

    public function dashboard(int $instiId, string $mes, int $anio): array
    {
        return $this->repo->dashboard($instiId, $mes, $anio);
    }

    public function vencidos(int $instiId): Collection
    {
        return $this->repo->vencidos($instiId);
    }

    public function generarMensualidades(int $instiId, string $mes, int $anio): array
    {
        $today = now()->toDateString();
        $estudiantes = $this->repo->getEstudiantesParaGeneracion($instiId, $anio);
        $numMes = $this->getNumeroMes($mes);

        $creados = 0; $omitidos = 0;

        foreach ($estudiantes as $est) {
            if ($this->repo->existePago($est->estu_id, $mes, $anio)) {
                $omitidos++; continue;
            }

            $monto = $this->resolverMontoMensual($instiId, $est->grado_id, $anio, $est->mensualidad, $est->nivel_id);
            [$montoFinal, $obs] = $this->aplicarDescuentos($est->estu_id, $monto, $today, $this->getConceptoMensualId($instiId), $est->nivel_id, $est->grado_id);

            $this->repo->create([
                'insti_id'    => $instiId,
                'estu_id'     => $est->estu_id,
                'contacto_id' => $est->contacto_id,
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

        $this->auditoria->registrar('generar_mensualidades', 'Pago', 0, "Mensualidades {$mes} {$anio}: {$creados} creadas.");
        return ['creados' => $creados, 'omitidos' => $omitidos, 'total' => $estudiantes->count()];
    }

    public function generarMensualidadAlumno(int $instiId, int $estuId, string $mes, int $anio): array
    {
        if ($this->repo->existePago($estuId, $mes, $anio)) {
            return ['status' => 'exists', 'message' => 'Ya existe una mensualidad para este período'];
        }

        $est = $this->repo->getEstudiantesParaGeneracion($instiId, $anio)->firstWhere('estu_id', $estuId);
        if (!$est) return ['status' => 'error', 'message' => 'Estudiante no encontrado'];

        $monto = $this->resolverMontoMensual($instiId, $est->grado_id, $anio, $est->mensualidad, $est->nivel_id);
        [$montoFinal, $obs] = $this->aplicarDescuentos($estuId, $monto, now()->toDateString(), $this->getConceptoMensualId($instiId), $est->nivel_id, $est->grado_id);

        $pago = $this->repo->create([
            'insti_id'    => $instiId,
            'estu_id'     => $estuId,
            'contacto_id' => $est->contacto_id,
            'pag_anual'   => $anio,
            'pag_mes'     => $mes,
            'pag_monto'   => $montoFinal,
            'total'       => $montoFinal,
            'estatus'     => 0,
            'pag_fecha'   => $this->calcularFechaVencimiento($anio, $this->getNumeroMes($mes), $est->dia_pago),
            'observacion' => $obs,
        ]);

        $this->auditoria->registrar('generar_mensualidad_individual', 'Pago', $pago->pag_id, "Mensualidad individual generada.");
        return ['status' => 'success', 'pago' => $pago];
    }

    public function obtenerMontoSugerido(int $instiId, int $estuId, int $anio): array
    {
        $est = $this->repo->getEstudiantesParaGeneracion($instiId, $anio)->firstWhere('estu_id', $estuId);
        if (!$est) return ['monto_base' => 0, 'monto_final' => 0, 'observacion' => 'No encontrado'];

        $montoBase = $this->resolverMontoMensual($instiId, $est->grado_id, $anio, $est->mensualidad, $est->nivel_id);
        [$montoFinal, $obs] = $this->aplicarDescuentos($estuId, $montoBase, now()->toDateString(), $this->getConceptoMensualId($instiId), $est->nivel_id, $est->grado_id);

        return ['monto_base' => $montoBase, 'monto_final' => $montoFinal, 'observacion' => $obs];
    }

    /**
     * Lógica de Negocio: Cálculos
     */
    private function resolverMontoMensual(int $instiId, ?int $gradoId, int $anio, ?string $fallback, ?int $nivelId = null): float
    {
        $monto = $this->repo->getMontoTarifa($instiId, $gradoId, $anio, 'mensual', $nivelId);
        return $monto ?? (float)($fallback ?? 0);
    }

    private function aplicarDescuentos(int $estuId, float $monto, string $fecha, ?int $conceptoId, ?int $nivelId = null, ?int $gradoId = null): array
    {
        $descuentos = $this->repo->getDescuentosEstudiante($estuId, $fecha, $conceptoId, $nivelId, $gradoId);
        if ($descuentos->isEmpty()) return [$monto, null];

        $montoOriginal = $monto;
        $detalles = [];
        foreach ($descuentos as $d) {
            $desc = ($d->tipo === 'porcentaje') ? round($montoOriginal * ($d->valor / 100), 2) : min((float)$d->valor, $monto);
            $monto = max($monto - $desc, 0);
            $detalles[] = $d->tipo === 'porcentaje' ? "Desc. {$d->motivo} {$d->valor}% (-S/ {$desc})" : "Desc. {$d->motivo} (-S/ {$desc})";
        }
        return [$monto, implode(', ', $detalles)];
    }

    private function getConceptoMensualId(int $instiId): ?int
    {
        return DB::table('concepto_pago')->where('insti_id', $instiId)->where('periodicidad', 'mensual')->where('activo', 1)->value('concepto_id');
    }

    private function getNumeroMes(string $mes): int
    {
        $map = ['ENERO'=>1,'FEBRERO'=>2,'MARZO'=>3,'ABRIL'=>4,'MAYO'=>5,'JUNIO'=>6,'JULIO'=>7,'AGOSTO'=>8,'SEPTIEMBRE'=>9,'OCTUBRE'=>10,'NOVIEMBRE'=>11,'DICIEMBRE'=>12];
        return $map[$mes] ?? (int)now()->month;
    }

    private function calcularFechaVencimiento(int $anio, int $mes, ?int $dia): string
    {
        $ultimo = cal_days_in_month(CAL_GREGORIAN, $mes, $anio);
        $dia = min($dia ?? 1, $ultimo);
        return sprintf('%04d-%02d-%02d', $anio, $mes, $dia);
    }

    /**
     * Vouchers / Notificaciones
     */
    public function subirVoucher(int $pagoId, int $userId, UploadedFile $archivo): PagoNotifica
    {
        $path = $archivo->store('vouchers', 'public');
        $notifica = $this->notificaRepo->create(['pag_id' => $pagoId, 'user_id' => $userId, 'archivo' => $path, 'estado' => 'Pendiente']);
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
        $updated = $this->notificaRepo->actualizarEstado($notifica, $estado, $comentario);
        if ($estado === 'validado') {
            $pago = $this->repo->findById($notifica->pag_id);
            if ($pago->estatus !== 1) $this->repo->update($pago, ['estatus' => 1]);
        }
        $this->auditoria->registrar('validar_voucher', 'PagoNotifica', $notificaId, "Voucher procesado: {$estado}");
        return $updated;
    }

    public function historialAlumno(int $instiId, int $estuId): array
    {
        return $this->repo->historialAlumno($instiId, $estuId);
    }

    public function reporteConsolidado(int $instiId, string $mes, int $anio): array
    {
        return $this->repo->reporteConsolidado($instiId, $mes, $anio);
    }

    public function generarPagosMatricula(int $instiId, int $estuId, int $contactoId, int $anio, array $conceptos): array
    {
        $today = now()->toDateString();
        $mes   = strtoupper(now()->locale('es')->isoFormat('MMMM'));
        $creados = 0;

        // Obtener nivel y grado del alumno para aplicar descuentos
        $est = $this->repo->getEstudiantesParaGeneracion($instiId, $anio)->firstWhere('estu_id', $estuId);

        foreach ($conceptos as $c) {
            $montoOriginal = (float) $c['monto'];
            $conceptoId = $c['id'] ?? null; // Asumiendo que el ID viene en el array

            [$montoFinal, $obs] = $this->aplicarDescuentos(
                $estuId, 
                $montoOriginal, 
                $today, 
                $conceptoId,
                $est?->nivel_id,
                $est?->grado_id
            );
            
            $pago = $this->repo->create([
                'insti_id'    => $instiId,
                'estu_id'     => $estuId,
                'contacto_id' => $contactoId,
                'pag_anual'   => $anio,
                'pag_mes'     => $mes,
                'pag_monto'   => $montoFinal,
                'pag_nombre1' => $c['nombre'],
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
}