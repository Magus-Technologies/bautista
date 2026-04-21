<?php

namespace App\Repositories\Implements;

use App\Models\Estudiante;
use App\Models\Matricula;
use App\Models\MatriculaApertura;
use App\Repositories\Interfaces\MatriculaRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class MatriculaRepository implements MatriculaRepositoryInterface
{
    // ── Aperturas ────────────────────────────────────────────────────────────

    public function paginateAperturas(int $instiId, string $search = '', int $perPage = 15): LengthAwarePaginator
    {
        return MatriculaApertura::withCount('matriculas')
            ->where('insti_id', $instiId)
            ->when($search, fn ($q) => $q
                ->where('nombre', 'like', "%{$search}%")
                ->orWhere('anio', 'like', "%{$search}%")
            )
            ->latest('apertura_id')
            ->paginate($perPage);
    }

    public function findAperturaById(int $id): MatriculaApertura
    {
        return MatriculaApertura::withCount('matriculas')->findOrFail($id);
    }

    public function createApertura(array $data): MatriculaApertura
    {
        return MatriculaApertura::create($data);
    }

    public function updateApertura(MatriculaApertura $apertura, array $data): MatriculaApertura
    {
        $apertura->update($data);
        return $apertura->loadCount('matriculas');
    }

    public function deleteApertura(MatriculaApertura $apertura): void
    {
        $apertura->delete();
    }

    // ── Matrículas ───────────────────────────────────────────────────────────

    public function paginateMatriculas(int $aperturaId, string $search = '', int $perPage = 15, ?int $nivelId = null): LengthAwarePaginator
    {
        return Matricula::with(['estudiante.perfil', 'estudiante.user', 'seccion.grado.nivel'])
            ->where('apertura_id', $aperturaId)
            ->when($search, fn ($q) => $q->whereHas('estudiante.perfil', fn ($p) => $p
                ->where('primer_nombre', 'like', "%{$search}%")
                ->orWhere('apellido_paterno', 'like', "%{$search}%")
                ->orWhere('doc_numero', 'like', "%{$search}%")
            ))
            ->when($nivelId, fn ($q) => $q->whereHas('seccion.grado', fn ($g) => $g
                ->where('nivel_id', $nivelId)
            ))
            ->latest('matricula_id')
            ->paginate($perPage);
    }

    public function countByNivel(int $aperturaId): \Illuminate\Support\Collection
    {
        $apertura = MatriculaApertura::findOrFail($aperturaId);

        return DB::table('niveles_educativos as ne')
            ->leftJoin('grados as g', 'ne.nivel_id', '=', 'g.nivel_id')
            ->leftJoin('secciones as s', 'g.grado_id', '=', 's.id_grado')
            ->leftJoin('matriculas as m', function($join) use ($aperturaId) {
                $join->on('s.seccion_id', '=', 'm.seccion_id')
                     ->where('m.apertura_id', '=', $aperturaId)
                     ->where('m.estado', '=', '1');
            })
            ->where('ne.insti_id', $apertura->insti_id)
            ->where('ne.nivel_estatus', '1')
            ->groupBy('ne.nivel_id', 'ne.nombre_nivel')
            ->select(
                'ne.nivel_id',
                'ne.nombre_nivel',
                DB::raw('COUNT(m.matricula_id) as total')
            )
            ->orderBy('ne.nivel_id')
            ->get();
    }

    public function findMatriculaById(int $id): Matricula
    {
        return Matricula::with(['estudiante.perfil', 'estudiante.user', 'seccion.grado.nivel'])->findOrFail($id);
    }

    public function createMatricula(array $data): Matricula
    {
        $matricula = Matricula::create(array_merge($data, [
            'estado'          => '1',
            'fecha_matricula' => now()->toDateString(),
        ]));
        return $matricula->load(['estudiante.perfil', 'estudiante.user', 'seccion.grado']);
    }

    public function deleteMatricula(Matricula $matricula): void
    {
        $matricula->delete();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function estudiantesNoMatriculados(int $instiId, int $aperturaId): Collection
    {
        $yaMatriculados = Matricula::where('apertura_id', $aperturaId)
            ->pluck('estu_id');

        return Estudiante::with('perfil')
            ->where('insti_id', $instiId)
            ->where('estado', '1')
            ->whereNotIn('estu_id', $yaMatriculados)
            ->get();
    }

    public function getMatriculasBySecciones(array $seccionIds): Collection
    {
        return Matricula::whereIn('seccion_id', $seccionIds)
            ->where('estado', '1')
            ->with([
                'estudiante' => fn($q) => $q->select('estu_id', 'perfil_id', 'foto', 'user_id'),
                'estudiante.perfil' => fn($q) => $q->select('perfil_id', 'doc_numero', 'primer_nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno', 'fecha_nacimiento', 'telefono', 'direccion'),
                'seccion' => fn($q) => $q->select('seccion_id', 'grado_id', 'nombre'),
                'seccion.grado' => fn($q) => $q->select('grado_id', 'nombre_grado')
            ])
            ->get();
    }

    public function getMatriculasBySeccion(int $seccionId, ?int $aperturaId = null): Collection
    {
        return Matricula::where('seccion_id', $seccionId)
            ->when($aperturaId, fn($q) => $q->where('apertura_id', $aperturaId))
            ->where('estado', '1')
            ->with([
                'estudiante' => fn($q) => $q->select('estu_id', 'perfil_id', 'foto', 'user_id'),
                'estudiante.perfil' => fn($q) => $q->select('perfil_id', 'doc_numero', 'primer_nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno', 'fecha_nacimiento', 'telefono', 'direccion')
            ])
            ->get();
    }
}
