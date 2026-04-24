<?php

namespace App\Services\Implements;

use App\Models\RhNomina;
use App\Repositories\Interfaces\RhNominaRepositoryInterface;
use App\Repositories\Interfaces\RhContratoRepositoryInterface;
use App\Repositories\Interfaces\RhAsistenciaPersonalRepositoryInterface;
use App\Services\Interfaces\RhNominaServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class RhNominaService implements RhNominaServiceInterface
{
    public function __construct(
        private RhNominaRepositoryInterface $repository,
        private RhContratoRepositoryInterface $contratoRepository,
        private RhAsistenciaPersonalRepositoryInterface $asistenciaRepository
    ) {}

    public function paginate(int $instiId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginate($instiId, $filters, $perPage);
    }

    public function findById(int $id): RhNomina
    {
        return $this->repository->findById($id);
    }

    public function generarNominaMensual(int $instiId, int $mes, int $anio): array
    {
        $contratos = $this->contratoRepository->getContratosActivos($instiId);
        $generados = 0;
        $omitidos = 0;

        foreach ($contratos as $contrato) {
            // Verificar si ya existe nómina para este mes/año
            $existe = $this->repository->findByUserAndPeriod($contrato->user_id, $mes, $anio);
            if ($existe) {
                $omitidos++;
                continue;
            }

            // Obtener asistencias del mes para calcular descuentos por tardanza
            $asistencias = $this->asistenciaRepository->getAsistenciasByPeriodo($contrato->user_id, $mes, $anio);
            $totalTardanzas = $asistencias->where('estado', 'tardanza')->count();
            $descuentosTardanzas = $asistencias->sum('descuento_aplicado');
            $diasTrabajados = $asistencias->whereIn('estado', ['presente', 'tardanza'])->count();
            $diasAusentes = $asistencias->where('estado', 'ausente')->count();

            $sueldoNeto = $contrato->sueldo_base + $contrato->bonificaciones - $descuentosTardanzas;

            $this->repository->create([
                'user_id' => $contrato->user_id,
                'contrato_id' => $contrato->contrato_id,
                'insti_id' => $instiId,
                'mes' => $mes,
                'anio' => $anio,
                'sueldo_base' => $contrato->sueldo_base,
                'bonificaciones' => $contrato->bonificaciones,
                'total_descuentos' => $descuentosTardanzas,
                'descuentos_tardanzas' => $descuentosTardanzas,
                'dias_trabajados' => $diasTrabajados,
                'dias_ausentes' => $diasAusentes,
                'total_tardanzas' => $totalTardanzas,
                'sueldo_neto' => $sueldoNeto,
                'estado' => 'pendiente',
            ]);

            $generados++;
        }

        return [
            'generados' => $generados,
            'omitidos' => $omitidos,
        ];
    }

    public function aprobarNomina(int $id): RhNomina
    {
        $nomina = $this->repository->findById($id);
        return $this->repository->update($nomina, ['estado' => 'aprobado']);
    }

    public function registrarPago(int $id, string $fechaPago, ?string $observaciones = null): RhNomina
    {
        $nomina = $this->repository->findById($id);
        return $this->repository->update($nomina, [
            'estado' => 'pagado',
            'fecha_pago' => $fechaPago,
            'observaciones' => $observaciones,
        ]);
    }

    public function eliminar(int $id): void
    {
        $nomina = $this->repository->findById($id);
        if ($nomina->estado === 'pagado') {
            throw new \Exception('No se puede eliminar una nómina ya pagada');
        }
        $this->repository->delete($nomina);
    }
}
