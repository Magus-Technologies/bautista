<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRhContratoRequest;
use App\Http\Requests\UpdateRhContratoRequest;
use App\Http\Resources\RhContratoResource;
use App\Services\Interfaces\RhContratoServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RhContratoApiController extends Controller
{
    public function __construct(
        private RhContratoServiceInterface $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $instiId = $request->user()->insti_id;
        $search = (string) $request->input('search', '');
        $estado = (string) $request->input('estado', '');
        $perPage = $request->input('per_page', 15);

        $contratos = $this->service->paginate($instiId, $search, $estado, $perPage);

        return response()->json([
            'data' => RhContratoResource::collection($contratos->items()),
            'current_page' => $contratos->currentPage(),
            'last_page' => $contratos->lastPage(),
            'per_page' => $contratos->perPage(),
            'total' => $contratos->total(),
            'from' => $contratos->firstItem(),
            'to' => $contratos->lastItem(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $contrato = $this->service->findById($id);
        return response()->json(new RhContratoResource($contrato));
    }

    public function store(StoreRhContratoRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['insti_id'] = $request->user()->insti_id;

        $contrato = $this->service->create($data);
        
        // Cargar las relaciones necesarias
        $contrato->load(['user.perfil', 'user.horarioAsistencia']);

        return response()->json([
            'message' => 'Contrato creado exitosamente',
            'data' => new RhContratoResource($contrato),
        ], 201);
    }

    public function update(UpdateRhContratoRequest $request, int $id): JsonResponse
    {
        $contrato = $this->service->update($id, $request->validated());
        
        // Cargar las relaciones necesarias
        $contrato->load(['user.perfil', 'user.horarioAsistencia']);

        return response()->json([
            'message' => 'Contrato actualizado exitosamente',
            'data' => new RhContratoResource($contrato),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return response()->json([
            'message' => 'Contrato eliminado exitosamente',
        ]);
    }

    public function finalizar(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'fecha_fin' => 'required|date',
        ]);

        $contrato = $this->service->finalizarContrato($id, $request->fecha_fin);

        return response()->json([
            'message' => 'Contrato finalizado exitosamente',
            'data' => new RhContratoResource($contrato),
        ]);
    }

    public function suspender(int $id): JsonResponse
    {
        $contrato = $this->service->suspenderContrato($id);

        return response()->json([
            'message' => 'Contrato suspendido exitosamente',
            'data' => new RhContratoResource($contrato),
        ]);
    }

    public function reactivar(int $id): JsonResponse
    {
        $contrato = $this->service->reactivarContrato($id);

        return response()->json([
            'message' => 'Contrato reactivado exitosamente',
            'data' => new RhContratoResource($contrato),
        ]);
    }

    public function activos(Request $request): JsonResponse
    {
        $instiId = $request->user()->insti_id;
        $contratos = $this->service->getContratosActivos($instiId);

        return response()->json([
            'data' => RhContratoResource::collection($contratos),
        ]);
    }
}
