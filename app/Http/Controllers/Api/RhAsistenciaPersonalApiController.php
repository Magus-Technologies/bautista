<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRhAsistenciaPersonalRequest;
use App\Http\Requests\UpdateRhAsistenciaPersonalRequest;
use App\Http\Resources\RhAsistenciaPersonalResource;
use App\Services\Interfaces\RhAsistenciaPersonalServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RhAsistenciaPersonalApiController extends Controller
{
    public function __construct(
        private RhAsistenciaPersonalServiceInterface $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $instiId = $request->user()->insti_id;
        $filters = [
            'user_id' => $request->input('user_id'),
            'fecha_desde' => $request->input('fecha_desde'),
            'fecha_hasta' => $request->input('fecha_hasta'),
            'estado' => $request->input('estado'),
        ];
        $perPage = $request->input('per_page', 15);

        $asistencias = $this->service->paginate($instiId, $filters, $perPage);

        return response()->json([
            'data' => RhAsistenciaPersonalResource::collection($asistencias->items()),
            'current_page' => $asistencias->currentPage(),
            'last_page' => $asistencias->lastPage(),
            'per_page' => $asistencias->perPage(),
            'total' => $asistencias->total(),
            'from' => $asistencias->firstItem(),
            'to' => $asistencias->lastItem(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $asistencia = $this->service->findById($id);
        return response()->json(new RhAsistenciaPersonalResource($asistencia));
    }

    public function registrarEntrada(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $instiId = $request->user()->insti_id;
        $observaciones = $request->input('observaciones');

        $asistencia = $this->service->registrarEntrada($userId, $instiId, $observaciones);

        return response()->json([
            'message' => 'Entrada registrada exitosamente',
            'data' => new RhAsistenciaPersonalResource($asistencia),
        ], 201);
    }

    public function registrarSalida(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $asistencia = $this->service->registrarSalida($userId);

        return response()->json([
            'message' => 'Salida registrada exitosamente',
            'data' => new RhAsistenciaPersonalResource($asistencia),
        ]);
    }

    public function registrarManual(StoreRhAsistenciaPersonalRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['insti_id'] = $request->user()->insti_id;
        $data['registrado_por'] = $request->user()->id;

        $asistencia = $this->service->registrarManual($data);

        return response()->json([
            'message' => 'Asistencia registrada exitosamente',
            'data' => new RhAsistenciaPersonalResource($asistencia),
        ], 201);
    }

    public function update(UpdateRhAsistenciaPersonalRequest $request, int $id): JsonResponse
    {
        $asistencia = $this->service->update($id, $request->validated());

        return response()->json([
            'message' => 'Asistencia actualizada exitosamente',
            'data' => new RhAsistenciaPersonalResource($asistencia),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return response()->json([
            'message' => 'Asistencia eliminada exitosamente',
        ]);
    }

    public function reportePeriodo(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'mes' => 'required|integer|min:1|max:12',
            'anio' => 'required|integer|min:2020',
        ]);

        $reporte = $this->service->getReportePeriodo(
            $request->user_id,
            $request->mes,
            $request->anio
        );

        return response()->json([
            'data' => RhAsistenciaPersonalResource::collection($reporte['asistencias']),
            'estadisticas' => $reporte['estadisticas'],
        ]);
    }
}
