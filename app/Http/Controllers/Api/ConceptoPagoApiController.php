<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConceptoPago;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ConceptoPagoApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $conceptos = ConceptoPago::where('insti_id', $request->user()->insti_id)
            ->orderBy('nombre')
            ->get();

        return response()->json($conceptos);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre'       => ['required', 'string', 'max:100'],
            'descripcion'  => ['nullable', 'string'],
            'periodicidad' => ['required', Rule::in(['mensual', 'anual', 'unico'])],
            'opcional'     => ['boolean'],
        ]);

        $concepto = ConceptoPago::create(array_merge($data, [
            'insti_id' => $request->user()->insti_id,
            'activo'   => true,
            'opcional' => $data['opcional'] ?? false,
        ]));

        return response()->json($concepto, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $concepto = ConceptoPago::where('concepto_id', $id)
            ->where('insti_id', $request->user()->insti_id)
            ->firstOrFail();

        $data = $request->validate([
            'nombre'       => ['required', 'string', 'max:100'],
            'descripcion'  => ['nullable', 'string'],
            'periodicidad' => ['required', Rule::in(['mensual', 'anual', 'unico'])],
            'opcional'     => ['boolean'],
        ]);

        $concepto->update($data);

        return response()->json($concepto);
    }

    public function toggleEstado(Request $request, int $id): JsonResponse
    {
        $concepto = ConceptoPago::where('concepto_id', $id)
            ->where('insti_id', $request->user()->insti_id)
            ->firstOrFail();

        $concepto->update(['activo' => ! $concepto->activo]);

        return response()->json($concepto);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $concepto = ConceptoPago::where('concepto_id', $id)
            ->where('insti_id', $request->user()->insti_id)
            ->firstOrFail();

        // Verificar si está en uso en tarifas o descuentos
        $enTarifas    = \App\Models\TarifaPago::where('concepto_id', $id)->exists();
        $enDescuentos = \App\Models\DescuentoAlumno::where('concepto_id', $id)->exists();

        if ($enTarifas || $enDescuentos) {
            return response()->json([
                'message' => 'No se puede eliminar: este concepto está siendo usado en ' .
                    ($enTarifas ? 'tarifas' : '') .
                    ($enTarifas && $enDescuentos ? ' y ' : '') .
                    ($enDescuentos ? 'descuentos' : '') . '.',
            ], 422);
        }

        $concepto->delete();

        return response()->json(null, 204);
    }
}
