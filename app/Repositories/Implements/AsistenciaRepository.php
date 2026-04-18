<?php

namespace App\Repositories\Implements;

use App\Models\Asistencia;
use App\Models\Estudiante;
use App\Models\Docente;
use App\Models\User;
use App\Repositories\Interfaces\AsistenciaRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class AsistenciaRepository implements AsistenciaRepositoryInterface
{
    public function getPorPersonaMes(int $instiId, int $personaId, string $tipo, int $anio, int $mes): Collection
    {
        return Asistencia::where('insti_id', $instiId)
            ->where('id_persona', $personaId)
            ->where('tipo', $tipo)
            ->whereYear('fecha', $anio)
            ->whereMonth('fecha', $mes)
            ->orderBy('fecha')
            ->get();
    }

    public function getReporteMes(int $instiId, string $tipo, int $anio, int $mes, array $filters = []): Collection
    {
        $query = Asistencia::with($tipo === 'E' ? 'estudiante.perfil' : 'docente.perfil')
            ->where('insti_id', $instiId)
            ->where('tipo', $tipo)
            ->whereYear('fecha', $anio)
            ->whereMonth('fecha', $mes);

        if ($tipo === 'E') {
            $this->applyStudentFilters($query, $filters, 'id_persona');
        }

        return $query->orderBy('id_persona')->orderBy('fecha')->get();
    }

    public function marcar(array $data): Asistencia
    {
        $keys = [
            'id_persona' => $data['id_persona'],
            'tipo'       => $data['tipo'],
            'fecha'      => $data['fecha'],
            'turno'      => $data['turno'] ?? null,
        ];

        // Si es salida (no trae estado), no sobreescribir estado existente
        $existing = Asistencia::where($keys)->first();
        if ($existing && !isset($data['estado'])) {
            $existing->update(array_diff_key($data, array_flip(['estado'])));
            return $existing->fresh();
        }

        return Asistencia::updateOrCreate($keys, $data);
    }

    public function marcarBatch(int $instiId, array $registros): void
    {
        foreach ($registros as $reg) {
            Asistencia::updateOrCreate(
                [
                    'id_persona' => $reg['id_persona'],
                    'tipo'       => $reg['tipo'],
                    'fecha'      => $reg['fecha'],
                    'turno'      => $reg['turno'] ?? null,
                ],
                array_merge($reg, ['insti_id' => $instiId])
            );
        }
    }

    public function findOrCreate(array $keys, array $values): Asistencia
    {
        return Asistencia::firstOrCreate($keys, $values);
    }

    public function getHistorialGlobal(int $limit = 20): Collection
    {
        return Asistencia::orderBy('asistencia_id', 'desc')->limit($limit)->get();
    }

    public function getPaginatedUsers(string $tipo, string $search = '', int $perPage = 20, array $filters = [])
    {
        $instiId = auth()->user()->insti_id ?? 1;

        if ($tipo === 'E') {
            $query = Estudiante::with('perfil')->where('insti_id', $instiId)->whereHas('matriculas');
            $this->applyStudentFilters($query, $filters);
        } else {
            $query = Docente::with('perfil')->where('id_insti', $instiId);
        }

        if ($search) {
            $query->whereHas('perfil', function ($q) use ($search) {
                $q->where('primer_nombre', 'like', "%{$search}%")
                  ->orWhere('apellido_paterno', 'like', "%{$search}%")
                  ->orWhere('doc_numero', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage);
    }

    /**
     * Helper to apply academic filters to student-related queries.
     */
    private function applyStudentFilters($query, array $filters, $column = 'estu_id')
    {
        if (empty($filters)) return;

        $relation = ($query->getModel() instanceof Asistencia) ? 'estudiante.matriculas' : 'matriculas';

        $query->whereHas($relation, function ($q) use ($filters) {
            // Filter by academic year (default to current if not specified)
            $anio = $filters['anio'] ?? date('Y');
            $q->where('anio', $anio);

            if (!empty($filters['seccion_id'])) {
                $q->where('seccion_id', $filters['seccion_id']);
            } elseif (!empty($filters['grado_id'])) {
                $q->whereHas('seccion', fn($sq) => $sq->where('id_grado', $filters['grado_id']));
            } elseif (!empty($filters['nivel_id'])) {
                $q->whereHas('seccion.grado', fn($gq) => $gq->where('nivel_id', $filters['nivel_id']));
            }
        });
    }

    public function getPorPersonaRango(int $id, string $tipo, string $fechaInicio, string $fechaFin): Collection
    {
        return Asistencia::where('id_persona', $id)
            ->where('tipo', $tipo)
            ->whereBetween('fecha', [$fechaInicio, $fechaFin])
            ->orderBy('fecha', 'desc')
            ->get();
    }

    public function eliminar(int $id): void
    {
        Asistencia::findOrFail($id)->delete();
    }
}
