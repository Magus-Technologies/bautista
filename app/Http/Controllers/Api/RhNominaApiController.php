<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RhNominaResource;
use App\Services\Interfaces\RhNominaServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RhNominaApiController extends Controller
{
    public function __construct(
        private RhNominaServiceInterface $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $instiId = $request->user()->insti_id;
        $filters = [
            'user_id' => $request->input('user_id'),
            'mes' => $request->input('mes'),
            'anio' => $request->input('anio'),
            'estado' => $request->input('estado'),
        ];
        $perPage = $request->input('per_page', 15);

        $nominas = $this->service->paginate($instiId, $filters, $perPage);

        return response()->json([
            'data' => RhNominaResource::collection($nominas->items()),
            'current_page' => $nominas->currentPage(),
            'last_page' => $nominas->lastPage(),
            'per_page' => $nominas->perPage(),
            'total' => $nominas->total(),
            'from' => $nominas->firstItem(),
            'to' => $nominas->lastItem(),
        ]);
    }

    public function generar(Request $request): JsonResponse
    {
        $request->validate([
            'mes' => 'required|integer|min:1|max:12',
            'anio' => 'required|integer|min:2020',
        ]);

        $instiId = $request->user()->insti_id;
        $result = $this->service->generarNominaMensual($instiId, $request->mes, $request->anio);

        return response()->json([
            'message' => "Se generaron {$result['generados']} nóminas. {$result['omitidos']} ya existían.",
            'data' => $result,
        ]);
    }

    public function aprobar(int $id): JsonResponse
    {
        $nomina = $this->service->aprobarNomina($id);
        return response()->json([
            'message' => 'Nómina aprobada exitosamente',
            'data' => new RhNominaResource($nomina),
        ]);
    }

    public function pagar(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'fecha_pago' => 'required|date',
            'observaciones' => 'nullable|string',
        ]);

        $nomina = $this->service->registrarPago($id, $request->fecha_pago, $request->observaciones);
        return response()->json([
            'message' => 'Pago registrado exitosamente',
            'data' => new RhNominaResource($nomina),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->eliminar($id);
            return response()->json(['message' => 'Nómina eliminada exitosamente']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
