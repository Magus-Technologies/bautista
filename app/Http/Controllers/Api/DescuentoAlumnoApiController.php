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
        $today = now()->toDateString();
        $descuentos = DescuentoAlumno::with(['estudiante.perfil', 'concepto', 'nivel', 'grado', 'seccion'])
            ->where('insti_id', $request->user()->insti_id)
            ->where(function ($q) use ($request, $today) {
                if ($request->hasAny(['estu_id', 'nivel_id', 'grado_id'])) {
                    $q->where('activo', true)
                      ->where('fecha_inicio', '<=', $today)
                      ->where(fn ($sq) => $sq->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', $today))
                      ->where(function ($sq) use ($request) {
                          if ($id = $request->get('estu_id'))  $sq->orWhere('estu_id', $id);
                          if ($id = $request->get('nivel_id')) $sq->orWhere('nivel_id', $id);
                          if ($id = $request->get('grado_id')) $sq->orWhere('grado_id', $id);
                      });
                }
            })
            ->orderByDesc('created_at')
            ->get();
    
        return response()->json($descuentos);
    }
    
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'estu_id'      => ['nullable', 'integer'],
            'nivel_id'     => ['nullable', 'integer'],
            'grado_id'     => ['nullable', 'integer'],
            'seccion_id'   => ['nullable', 'integer'],
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
    
        return response()->json($descuento->load(['estudiante.perfil', 'concepto', 'nivel', 'grado', 'seccion']), 201);
    }
    
    public function update(Request $request, int $id): JsonResponse
    {
        $descuento = DescuentoAlumno::where('descuento_id', $id)
            ->where('insti_id', $request->user()->insti_id)
            ->firstOrFail();
    
        $data = $request->validate([
            'estu_id'      => ['nullable', 'integer'],
            'nivel_id'     => ['nullable', 'integer'],
            'grado_id'     => ['nullable', 'integer'],
            'seccion_id'   => ['nullable', 'integer'],
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
