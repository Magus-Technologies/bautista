<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RhAsistenciaPersonalResource;
use App\Http\Resources\RhNominaResource;
use App\Models\RhAsistenciaPersonal;
use App\Models\RhNomina;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RhTrabajadorApiController extends Controller
{
    public function miAsistencia(Request $request): JsonResponse
    {
        $userId  = $request->user()->id;
        $perPage = $request->input('per_page', 15);

        $query = RhAsistenciaPersonal::with(['horario'])
            ->where('user_id', $userId)
            ->orderByDesc('fecha');

        if ($request->filled('mes')) {
            $query->whereMonth('fecha', $request->mes);
        }
        if ($request->filled('anio')) {
            $query->whereYear('fecha', $request->anio);
        }
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        $paginated = $query->paginate($perPage);

        return response()->json([
            'data'         => RhAsistenciaPersonalResource::collection($paginated->items()),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'per_page'     => $paginated->perPage(),
            'total'        => $paginated->total(),
            'from'         => $paginated->firstItem(),
            'to'           => $paginated->lastItem(),
        ]);
    }

    public function misBoletas(Request $request): JsonResponse
    {
        $userId  = $request->user()->id;
        $perPage = $request->input('per_page', 15);

        $query = RhNomina::with('user')
            ->where('user_id', $userId)
            ->orderByDesc('anio')
            ->orderByDesc('mes');

        if ($request->filled('mes')) {
            $query->where('mes', $request->mes);
        }
        if ($request->filled('anio')) {
            $query->where('anio', $request->anio);
        }
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        $paginated = $query->paginate($perPage);

        return response()->json([
            'data'         => RhNominaResource::collection($paginated->items()),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'per_page'     => $paginated->perPage(),
            'total'        => $paginated->total(),
            'from'         => $paginated->firstItem(),
            'to'           => $paginated->lastItem(),
        ]);
    }

    public function descargarBoleta(int $id, Request $request)
    {
        $userId = $request->user()->id;

        $nomina = RhNomina::with(['user.perfil', 'user.institucion'])
            ->where('nomina_id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $institucion = $request->user()->institucion;

        $pdf = Pdf::loadView('pdf.boleta-nomina', [
            'nomina'      => $nomina,
            'institucion' => $institucion,
        ])->setPaper([0, 0, 420, 595], 'portrait');

        return $pdf->stream("boleta_{$nomina->periodo}.pdf");
    }
}
