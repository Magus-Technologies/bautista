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

    public function porEstudiante(Request $request, int $estuId): JsonResponse
    {
        $instiId = $request->user()->insti_id;
        
        // 1. Obtener todos los conceptos activos
        $conceptos = ConceptoPago::where('insti_id', $instiId)
            ->where('activo', true)
            ->get();

        // 2. Obtener nombres de conceptos que el alumno ya tiene registrados en sus pagos
        $conceptosUsados = \App\Models\Pago::where('estu_id', $estuId)
            ->select('pag_nombre1', 'pag_nombre2')
            ->get()
            ->flatMap(fn($p) => [$p->pag_nombre1, $p->pag_nombre2])
            ->filter()
            ->unique()
            ->toArray();

        // 3. Filtrar: mostrar si NO es opcional O si ya lo ha usado (se inscribió en él)
        $filtrados = $conceptos->filter(function($c) use ($conceptosUsados) {
            if (!$c->opcional) return true;
            return in_array($c->nombre, $conceptosUsados);
        })->values();

        return response()->json($filtrados);
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
