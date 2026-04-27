<?php

namespace App\Services\Implements;

use App\Models\RhAsistenciaPersonal;
use App\Models\RhContrato;
use App\Repositories\Interfaces\RhAsistenciaPersonalRepositoryInterface;
use App\Repositories\Interfaces\RhContratoRepositoryInterface;
use App\Services\Interfaces\RhAsistenciaPersonalServiceInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RhAsistenciaPersonalService implements RhAsistenciaPersonalServiceInterface
{
    public function __construct(
        private RhAsistenciaPersonalRepositoryInterface $repository,
        private RhContratoRepositoryInterface $contratoRepository,
        private \App\Repositories\Interfaces\AsistenciaRepositoryInterface $asistenciaRepository,
        private HorarioResolverService $horarioResolver
    ) {}

    public function paginate(int $instiId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginate($instiId, $filters, $perPage);
    }

    public function findById(int $id): RhAsistenciaPersonal
    {
        return $this->repository->findById($id);
    }

    public function registrarEntrada(int $userId, int $instiId, ?string $observaciones = null): RhAsistenciaPersonal
    {
        $fecha      = now()->toDateString();
        $horaEntrada = now()->toTimeString();

        if ($this->repository->findByUserAndDate($userId, $fecha)) {
            throw new \Exception('Ya existe un registro de asistencia para hoy.');
        }

        $contrato = $this->contratoRepository->findByUserId($userId);
        if (!$contrato) {
            throw new \Exception('El usuario no tiene un contrato activo.');
        }

        $horario = $this->horarioResolver->resolverParaTrabajador($userId, $instiId);

        [$minutosTardanza, $estado] = $this->calcularTardanza(
            $horaEntrada,
            $horario->hora_ingreso,
            $horario->minutos_tolerancia
        );

        $descuentoAplicado = $minutosTardanza > 0
            ? $this->calcularDescuento($contrato, $minutosTardanza)
            : 0.0;

        $asistenciaRh = $this->repository->create([
            'user_id'          => $userId,
            'contrato_id'      => $contrato->contrato_id,
            'horario_id'       => $horario->horario_id,
            'insti_id'         => $instiId,
            'fecha'            => $fecha,
            'hora_entrada'     => $horaEntrada,
            'estado'           => $estado,
            'minutos_tardanza' => $minutosTardanza,
            'descuento_aplicado' => $descuentoAplicado,
            'observaciones'    => $observaciones,
            'tipo_registro'    => 'automatico',
        ]);

        $this->sincronizarAsistenciaGeneral($instiId, $userId, $fecha, [
            'tipo'         => 'P',
            'hora_entrada' => $horaEntrada,
            'estado'       => $estado === 'tardanza' ? 'T' : '1',
            'turno'        => $horario->turno,
        ]);

        return $asistenciaRh;
    }

    public function registrarSalida(int $userId): RhAsistenciaPersonal
    {
        $fecha      = now()->toDateString();
        $horaSalida = now()->toTimeString();

        $asistencia = $this->repository->findByUserAndDate($userId, $fecha);
        if (!$asistencia) {
            throw new \Exception('No existe registro de entrada para hoy.');
        }
        if ($asistencia->hora_salida) {
            throw new \Exception('Ya se registró la salida para hoy.');
        }

        $minutosSalidaAnticipada = 0;
        $descuentoSalida         = 0.0;

        if ($asistencia->horario) {
            $horaSalidaEsperada = Carbon::parse($asistencia->horario->hora_salida);
            $horaSalidaReal     = Carbon::parse($horaSalida);

            if ($horaSalidaReal->lt($horaSalidaEsperada)) {
                $minutosSalidaAnticipada = (int) $horaSalidaReal->diffInMinutes($horaSalidaEsperada, true);

                if ($asistencia->contrato) {
                    $descuentoSalida = $this->calcularDescuento(
                        $asistencia->contrato,
                        $minutosSalidaAnticipada
                    );
                }
            }
        }

        $asistenciaRh = $this->repository->update($asistencia, [
            'hora_salida'              => $horaSalida,
            'minutos_salida_anticipada' => $minutosSalidaAnticipada,
            'descuento_aplicado'       => $asistencia->descuento_aplicado + $descuentoSalida,
        ]);

        $this->sincronizarAsistenciaGeneral($asistencia->insti_id, $userId, $fecha, [
            'hora_salida' => $horaSalida,
            'turno'       => $asistencia->horario?->turno ?? (now()->hour < 13 ? 'M' : 'T'),
        ]);

        return $asistenciaRh;
    }

    public function registrarManual(array $data): RhAsistenciaPersonal
    {
        if ($this->repository->findByUserAndDate($data['user_id'], $data['fecha'])) {
            throw new \Exception('Ya existe un registro de asistencia para esta fecha.');
        }

        $contrato = $this->contratoRepository->findByUserId($data['user_id']);
        if ($contrato) {
            $data['contrato_id'] = $data['contrato_id'] ?? $contrato->contrato_id;
        }

        // Auto-calcular tardanza y salida anticipada si hay horario y horas registradas
        if (!empty($data['horario_id']) && $contrato) {
            $horario = \App\Models\HorarioAsistencia::find($data['horario_id']);
            if ($horario) {
                if (!empty($data['hora_entrada'])) {
                    [$minutosTardanza] = $this->calcularTardanza(
                        $data['hora_entrada'],
                        $horario->hora_ingreso,
                        $horario->minutos_tolerancia
                    );
                    $data['minutos_tardanza'] = $minutosTardanza;
                    $descuento = $minutosTardanza > 0 ? $this->calcularDescuento($contrato, $minutosTardanza) : 0.0;
                    $data['descuento_aplicado'] = $descuento;
                }

                if (!empty($data['hora_salida'])) {
                    $salidaReal     = Carbon::parse($data['hora_salida']);
                    $salidaEsperada = Carbon::parse($horario->hora_salida);
                    if ($salidaReal->lt($salidaEsperada)) {
                        $minutosSalidaAnticipada = (int) $salidaReal->diffInMinutes($salidaEsperada, true);
                        $data['minutos_salida_anticipada'] = $minutosSalidaAnticipada;
                        $descuentoSalida = $this->calcularDescuento($contrato, $minutosSalidaAnticipada);
                        $data['descuento_aplicado'] = ($data['descuento_aplicado'] ?? 0) + $descuentoSalida;
                    }
                }
            }
        }

        $data['tipo_registro'] = 'manual';
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): RhAsistenciaPersonal
    {
        $asistencia = $this->repository->findById($id);
        return $this->repository->update($asistencia, $data);
    }

    public function delete(int $id): void
    {
        $asistencia = $this->repository->findById($id);
        $this->repository->delete($asistencia);
    }

    public function getReportePeriodo(int $userId, int $mes, int $anio): array
    {
        $asistencias = $this->repository->getAsistenciasByPeriodo($userId, $mes, $anio);
        $tardanzas   = $this->repository->getTardanzasByPeriodo($userId, $mes, $anio);

        return [
            'asistencias' => $asistencias,
            'estadisticas' => [
                'total_dias'               => $asistencias->count(),
                'dias_presentes'           => $asistencias->where('estado', 'presente')->count(),
                'dias_ausentes'            => $asistencias->where('estado', 'ausente')->count(),
                'total_tardanzas'          => $tardanzas->count(),
                'minutos_tardanza_total'   => $asistencias->sum('minutos_tardanza'),
                'minutos_salida_anticipada' => $asistencias->sum('minutos_salida_anticipada'),
                'total_descuentos'         => $asistencias->sum('descuento_aplicado'),
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Helpers privados
    // -------------------------------------------------------------------------

    /**
     * Calcula el descuento monetario según el tipo configurado en el contrato.
     *
     * - fijo:        monto plano (no depende de minutos)
     * - porcentaje:  % del sueldo diario (no depende de minutos)
     * - proporcional: costo por minuto * minutos no laborados
     */
    private function calcularDescuento(RhContrato $contrato, int $minutos): float
    {
        return match ($contrato->tipo_descuento) {
            'fijo'         => (float) $contrato->descuento_por_tardanza,
            'porcentaje'   => round(($contrato->sueldo_base / 30) * ($contrato->descuento_por_tardanza / 100), 2),
            'proporcional' => round(($contrato->sueldo_base / ($contrato->horas_semanales * 4 * 60)) * $minutos, 2),
            default        => 0.0,
        };
    }

    /**
     * Calcula tardanza comparando la hora real contra la hora esperada con tolerancia.
     * Devuelve [minutos_tardanza, estado].
     */
    private function calcularTardanza(string $horaReal, string $horaEsperada, int $tolerancia): array
    {
        $real      = Carbon::parse($horaReal);
        $esperada  = Carbon::parse($horaEsperada);
        $conTolerancia = $esperada->copy()->addMinutes($tolerancia);

        if ($real->gt($conTolerancia)) {
            return [(int) $real->diffInMinutes($esperada, true), 'tardanza'];
        }

        return [0, 'presente'];
    }

    private function sincronizarAsistenciaGeneral(int $instiId, int $userId, string $fecha, array $extra): void
    {
        try {
            $this->asistenciaRepository->marcar(array_merge([
                'insti_id'   => $instiId,
                'id_persona' => $userId,
                'tipo'       => 'P',
                'fecha'      => $fecha,
            ], $extra));
        } catch (\Exception) {
            // No bloquear el flujo RH si la sincronización general falla
        }
    }
}
