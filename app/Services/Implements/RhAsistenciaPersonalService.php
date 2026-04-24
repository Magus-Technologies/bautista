<?php

namespace App\Services\Implements;

use App\Models\RhAsistenciaPersonal;
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
        private \App\Repositories\Interfaces\AsistenciaRepositoryInterface $asistenciaRepository
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
        $fecha = now()->toDateString();
        $horaEntrada = now()->toTimeString();

        // Verificar si ya existe registro para hoy
        $asistenciaExistente = $this->repository->findByUserAndDate($userId, $fecha);
        if ($asistenciaExistente) {
            throw new \Exception('Ya existe un registro de asistencia para hoy');
        }

        // Obtener contrato activo
        $contrato = $this->contratoRepository->findByUserId($userId);
        if (!$contrato) {
            throw new \Exception('El usuario no tiene un contrato activo');
        }

        // Calcular tardanza
        $horaEntradaEsperada = Carbon::parse($contrato->hora_entrada);
        $horaEntradaReal = Carbon::parse($horaEntrada);
        $minutosTardanza = 0;
        $estado = 'presente';
        $descuentoAplicado = 0;

        $horaEntradaConTolerancia = $horaEntradaEsperada->copy()->addMinutes($contrato->minutos_tolerancia);

        if ($horaEntradaReal->greaterThan($horaEntradaConTolerancia)) {
            $minutosTardanza = $horaEntradaReal->diffInMinutes($horaEntradaEsperada);
            $estado = 'tardanza';
            
            // Calcular descuento
            if ($contrato->tipo_descuento === 'fijo') {
                $descuentoAplicado = $contrato->descuento_por_tardanza;
            } else {
                // Porcentaje del sueldo diario
                $sueldoDiario = $contrato->sueldo_base / 30;
                $descuentoAplicado = ($sueldoDiario * $contrato->descuento_por_tardanza) / 100;
            }
        }

        $asistenciaRh = $this->repository->create([
            'user_id' => $userId,
            'contrato_id' => $contrato->contrato_id,
            'insti_id' => $instiId,
            'fecha' => $fecha,
            'hora_entrada' => $horaEntrada,
            'estado' => $estado,
            'minutos_tardanza' => $minutosTardanza,
            'descuento_aplicado' => $descuentoAplicado,
            'observaciones' => $observaciones,
            'tipo_registro' => 'automatico',
        ]);

        // Sincronizar con asistencia general
        try {
            $this->asistenciaRepository->marcar([
                'insti_id' => $instiId,
                'id_persona' => $userId,
                'tipo' => 'P',
                'fecha' => $fecha,
                'hora_entrada' => $horaEntrada,
                'estado' => $estado === 'tardanza' ? 'T' : '1',
                'turno' => now()->hour < 13 ? 'M' : 'T',
            ]);
        } catch (\Exception $e) {
            // Ignorar errores en sincronización general para no bloquear RH
        }

        return $asistenciaRh;
    }

    public function registrarSalida(int $userId): RhAsistenciaPersonal
    {
        $fecha = now()->toDateString();
        $horaSalida = now()->toTimeString();

        $asistencia = $this->repository->findByUserAndDate($userId, $fecha);
        if (!$asistencia) {
            throw new \Exception('No existe registro de entrada para hoy');
        }

        if ($asistencia->hora_salida) {
            throw new \Exception('Ya se registró la salida para hoy');
        }

        $asistenciaRh = $this->repository->update($asistencia, [
            'hora_salida' => $horaSalida,
        ]);

        // Sincronizar con asistencia general
        try {
            $this->asistenciaRepository->marcar([
                'insti_id' => $asistenciaRh->insti_id,
                'id_persona' => $userId,
                'tipo' => 'P',
                'fecha' => $fecha,
                'hora_salida' => $horaSalida,
                'turno' => now()->hour < 13 ? 'M' : 'T',
            ]);
        } catch (\Exception $e) {
            // Ignorar
        }

        return $asistenciaRh;
    }

    public function registrarManual(array $data): RhAsistenciaPersonal
    {
        // Verificar si ya existe registro
        $asistenciaExistente = $this->repository->findByUserAndDate($data['user_id'], $data['fecha']);
        if ($asistenciaExistente) {
            throw new \Exception('Ya existe un registro de asistencia para esta fecha');
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
        $tardanzas = $this->repository->getTardanzasByPeriodo($userId, $mes, $anio);

        $totalDias = $asistencias->count();
        $diasPresentes = $asistencias->where('estado', 'presente')->count();
        $diasAusentes = $asistencias->where('estado', 'ausente')->count();
        $totalTardanzas = $tardanzas->count();
        $totalDescuentos = $tardanzas->sum('descuento_aplicado');

        return [
            'asistencias' => $asistencias,
            'estadisticas' => [
                'total_dias' => $totalDias,
                'dias_presentes' => $diasPresentes,
                'dias_ausentes' => $diasAusentes,
                'total_tardanzas' => $totalTardanzas,
                'total_descuentos' => $totalDescuentos,
            ],
        ];
    }
}
