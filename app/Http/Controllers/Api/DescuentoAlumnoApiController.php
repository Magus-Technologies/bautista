<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DescuentoAlumno;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DescuentoAlumnoApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $descuentos = DescuentoAlumno::with(['estudiante.perfil', 'concepto'])
            ->where('insti_id', $request->user()->insti_id)
            ->when($request->get('estu_id'), fn ($q) => $q->where('estu_id', $request->get('estu_id')))
            ->orderByDesc('created_at')
            ->get();

        return response()->json($descuentos);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'estu_id'      => ['required', 'integer'],
            'concepto_id'  => ['nullable', 'integer'],
            'motivo'       => ['required', Rule::in(['hermanos', 'merito', 'beca', 'otro'])],
            'tipo'         => ['required', Rule::in(['porcentaje', 'monto_fijo'])],
            'valor'        => ['required', 'numeric', 'min:0'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin'    => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'observacion'  => ['nullable', 'string'],
        ]);

        $descuento = DescuentoAlumno::create(array_merge($data, [
            'insti_id' => $request->user()->insti_id,
            'activo'   => true,
        ]));

        return response()->json($descuento->load(['estudiante.perfil', 'concepto']), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $descuento = DescuentoAlumno::where('descuento_id', $id)
            ->where('insti_id', $request->user()->insti_id)
            ->firstOrFail();

        $data = $request->validate([
            'concepto_id'  => ['nullable', 'integer'],
            'motivo'       => ['required', Rule::in(['hermanos', 'merito', 'beca', 'otro'])],
            'tipo'         => ['required', Rule::in(['porcentaje', 'monto_fijo'])],
            'valor'        => ['required', 'numeric', 'min:0'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin'    => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'observacion'  => ['nullable', 'string'],
            'activo'       => ['boolean'],
        ]);

        $descuento->update($data);

        return response()->json($descuento->load(['estudiante.perfil', 'concepto']));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $descuento = DescuentoAlumno::where('descuento_id', $id)
            ->where('insti_id', $request->user()->insti_id)
            ->firstOrFail();

        $descuento->delete();

        return response()->json(null, 204);
    }
}
