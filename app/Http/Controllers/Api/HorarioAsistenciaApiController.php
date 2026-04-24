<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\HorarioNotFoundException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHorarioAsistenciaRequest;
use App\Http\Requests\UpdateHorarioAsistenciaRequest;
use App\Http\Resources\HorarioAsistenciaResource;
use App\Models\HorarioAsistencia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HorarioAsistenciaApiController extends Controller
{
    /**
     * GET /api/horarios-asistencia
     * Listar horarios de asistencia con búsqueda y paginación
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = HorarioAsistencia::with(['nivel', 'institucion', 'rol']);

        // Filtrar por tipo de usuario
        // Si es 'T' (Trabajador), incluir tanto 'T' como 'D' (Docentes)
        if ($request->has('tipo_usuario')) {
            if ($request->tipo_usuario === 'T') {
                $query->whereIn('tipo_usuario', ['T', 'D']);
            } elseif (in_array($request->tipo_usuario, ['E', 'D'])) {
                $query->where('tipo_usuario', $request->tipo_usuario);
            }
        }

        // Búsqueda
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('tipo_usuario', 'like', "%{$search}%")
                  ->orWhere('turno', 'like', "%{$search}%")
                  ->orWhereHas('nivel', function($q) use ($search) {
                      $q->where('nombre_nivel', 'like', "%{$search}%");
                  });
            });
        }

        // Paginación
        $perPage = $request->get('per_page', 15);
        $horarios = $query->paginate($perPage);
        
        return HorarioAsistenciaResource::collection($horarios);
    }

    /**
     * POST /api/horarios-asistencia
     * Crear nuevo horario de asistencia
     */
    public function store(StoreHorarioAsistenciaRequest $request)
    {
        $validated = $request->validated();
        $validated['insti_id'] = $request->user()->insti_id;
        
        $horario = HorarioAsistencia::create($validated);
        
        return response()->json([
            'message' => 'Horario de asistencia creado exitosamente',
            'horario' => new HorarioAsistenciaResource($horario->load(['nivel', 'institucion', 'rol']))
        ], 201);
    }

    /**
     * GET /api/horarios-asistencia/{id}
     * Obtener un horario de asistencia específico
     */
    public function show(int $id)
    {
        $horario = HorarioAsistencia::with(['nivel', 'institucion', 'rol'])->find($id);
        
        if (!$horario) {
            throw new HorarioNotFoundException("Horario de asistencia con ID {$id} no encontrado");
        }
        
        return response()->json(new HorarioAsistenciaResource($horario));
    }

    /**
     * PUT /api/horarios-asistencia/{id}
     * Actualizar horario de asistencia
     */
    public function update(UpdateHorarioAsistenciaRequest $request, int $id)
    {
        $horario = HorarioAsistencia::find($id);
        
        if (!$horario) {
            throw new HorarioNotFoundException("Horario de asistencia con ID {$id} no encontrado");
        }
        
        $validated = $request->validated();
        $horario->update($validated);
        
        return response()->json([
            'message' => 'Horario de asistencia actualizado exitosamente',
            'horario' => new HorarioAsistenciaResource($horario->load(['nivel', 'institucion', 'rol']))
        ]);
    }

    /**
     * DELETE /api/horarios-asistencia/{id}
     * Eliminar horario de asistencia
     */
    public function destroy(int $id)
    {
        $horario = HorarioAsistencia::find($id);
        
        if (!$horario) {
            throw new HorarioNotFoundException("Horario de asistencia con ID {$id} no encontrado");
        }
        
        $horario->delete();
        
        return response()->json([
            'message' => 'Horario de asistencia eliminado exitosamente'
        ]);
    }
}
