<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TarifaPago;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TarifaPagoApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tarifas = TarifaPago::with(['concepto', 'grado'])
            ->where('insti_id', $request->user()->insti_id)
            ->orderBy('anio_escolar', 'desc')
            ->orderBy('concepto_id')
            ->get();

        return response()->json($tarifas);
    }

    public function store(Request $request): JsonResponse
    {
        $instiId = $request->user()->insti_id;

        $data = $request->validate([
            'concepto_id'      => ['required', 'integer'],
            'grado_id'         => ['nullable', 'integer'],
            'anio_escolar'     => ['required', 'integer', 'min:2020', 'max:2099'],
            'monto'            => ['required', 'numeric', 'min:0'],
            'dia_vencimiento'  => ['nullable', 'integer', 'min:1', 'max:28'],
        ]);

        // Impedir duplicado activo para misma combinación
        $duplicado = TarifaPago::where('insti_id', $instiId)
            ->where('concepto_id', $data['concepto_id'])
            ->where('grado_id', $data['grado_id'] ?? null)
            ->where('anio_escolar', $data['anio_escolar'])
            ->where('activo', true)
            ->exists();

        if ($duplicado) {
            return response()->json([
                'message' => 'Ya existe una tarifa activa para esta combinación de concepto, grado y año.',
            ], 422);
        }

        $tarifa = TarifaPago::create(array_merge($data, [
            'insti_id' => $instiId,
            'activo'   => true,
        ]));

        return response()->json($tarifa->load(['concepto', 'grado']), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tarifa = TarifaPago::where('tarifa_id', $id)
            ->where('insti_id', $request->user()->insti_id)
            ->firstOrFail();

        $data = $request->validate([
            'concepto_id'      => ['required', 'integer'],
            'grado_id'         => ['nullable', 'integer'],
            'anio_escolar'     => ['required', 'integer', 'min:2020', 'max:2099'],
            'monto'            => ['required', 'numeric', 'min:0'],
            'dia_vencimiento'  => ['nullable', 'integer', 'min:1', 'max:28'],
            'activo'           => ['boolean'],
        ]);

        $tarifa->update($data);

        return response()->json($tarifa->load(['concepto', 'grado']));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tarifa = TarifaPago::where('tarifa_id', $id)
            ->where('insti_id', $request->user()->insti_id)
            ->firstOrFail();

        $tarifa->delete();

        return response()->json(null, 204);
    }
}
