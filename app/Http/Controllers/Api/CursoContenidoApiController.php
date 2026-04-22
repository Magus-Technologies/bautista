<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClaseRequest;
use App\Http\Requests\StoreUnidadRequest;
use App\Http\Requests\UpdateClaseRequest;
use App\Http\Requests\UpdateUnidadRequest;
use App\Http\Resources\ClaseResource;
use App\Http\Resources\UnidadResource;
use App\Models\ArchivoClase;
use App\Services\Interfaces\CursoContenidoServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CursoContenidoApiController extends Controller
{
    public function __construct(
        private readonly CursoContenidoServiceInterface $service,
    ) {}

    // ── Contenido completo del curso ─────────────────────────────────────────

    public function show(int $cursoId): JsonResponse
    {
        $unidades = $this->service->obtenerContenido($cursoId);

        return response()->json(UnidadResource::collection($unidades));
    }

    // ── Unidades ─────────────────────────────────────────────────────────────

    public function storeUnidad(StoreUnidadRequest $request): JsonResponse
    {
        $unidad = $this->service->crearUnidad($request->validated());

        return (new UnidadResource($unidad))
            ->response()
            ->setStatusCode(201);
    }

    public function updateUnidad(UpdateUnidadRequest $request, int $id): UnidadResource
    {
        return new UnidadResource($this->service->actualizarUnidad($id, $request->validated()));
    }

    public function destroyUnidad(int $id): JsonResponse
    {
        $this->service->eliminarUnidad($id);
        return response()->json(null, 204);
    }

    public function reordenarUnidades(Request $request, int $cursoId): JsonResponse
    {
        $request->validate(['orden' => ['required', 'array']]);
        $this->service->reordenarUnidades($cursoId, $request->input('orden'));
        return response()->json(['ok' => true]);
    }

    // ── Clases ────────────────────────────────────────────────────────────────

    public function storeClase(StoreClaseRequest $request): JsonResponse
    {
        $clase = $this->service->crearClase($request->validated());

        return (new ClaseResource($clase))
            ->response()
            ->setStatusCode(201);
    }

    public function updateClase(UpdateClaseRequest $request, int $id): ClaseResource
    {
        return new ClaseResource($this->service->actualizarClase($id, $request->validated()));
    }

    public function destroyClase(int $id): JsonResponse
    {
        $this->service->eliminarClase($id);
        return response()->json(null, 204);
    }

    public function reordenarClases(Request $request, int $unidadId): JsonResponse
    {
        $request->validate(['orden' => ['required', 'array']]);
        $this->service->reordenarClases($unidadId, $request->input('orden'));
        return response()->json(['ok' => true]);
    }

    // ── Archivos de clase ────────────────────────────────────────────────────

    public function subirArchivo(Request $request, int $claseId): JsonResponse
    {
        $request->validate([
            'archivo' => ['required', 'file', 'max:20480'], // 20 MB
            'titulo' => ['nullable', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'visible' => ['nullable', 'in:0,1'],
        ]);

        $file = $request->file('archivo');
        $path = $file->store("clases/{$claseId}", 'public');

        $archivo = ArchivoClase::create([
            'clase_id' => $claseId,
            'nombre'   => $file->getClientOriginalName(),
            'titulo'   => $request->input('titulo', $file->getClientOriginalName()),
            'descripcion' => $request->input('descripcion'),
            'path'     => $path,
            'tipo'     => $file->getMimeType(),
            'tamanio'  => $file->getSize(),
            'visible'  => $request->input('visible', '1'),
        ]);

        return response()->json([
            'archivo_id' => $archivo->archivo_id,
            'nombre'     => $archivo->nombre,
            'titulo'     => $archivo->titulo,
            'descripcion' => $archivo->descripcion,
            'path'       => $archivo->path,
            'tipo'       => $archivo->tipo,
            'tamanio'    => $archivo->tamanio,
            'visible'    => $archivo->visible,
            'url'        => asset('storage/' . $archivo->path),
        ], 201);
    }

    public function eliminarArchivo(int $archivoId): JsonResponse
    {
        $archivo = ArchivoClase::findOrFail($archivoId);
        \Storage::disk('public')->delete($archivo->path);
        $archivo->delete();

        return response()->json(null, 204);
    }

    public function updateArchivo(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'visible' => ['required', 'in:0,1'],
        ]);

        $archivo = ArchivoClase::findOrFail($id);
        $archivo->update($request->only(['titulo', 'descripcion', 'visible']));

        return response()->json($archivo);
    }

    // ── Archivos de Actividad ────────────────────────────────────────────────
    public function listarArchivosActividad(int $actividadId): JsonResponse
    {
        $archivos = \DB::table('archivos_actividad')
            ->where('id_actividad', $actividadId)
            ->where('origen', 'd') // Docente
            ->get()
            ->map(function($a) {
                return [
                    'archivo_id' => $a->archiv_actividad_id,
                    'nombre' => $a->nombre_archivo,
                    'url' => asset('storage/' . $a->archivo),
                    'tipo' => $a->tipo_archivo,
                    'created_at' => $a->created_at
                ];
            });

        return response()->json($archivos);
    }

    public function subirArchivoActividad(Request $request, int $actividadId): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:20480'],
        ]);

        $file = $request->file('file');
        $path = $file->store("actividades/{$actividadId}", 'public');

        \DB::table('archivos_actividad')->insert([
            'id_actividad' => $actividadId,
            'origen' => 'd',
            'archivo' => $path,
            'nombre_archivo' => $file->getClientOriginalName(),
            'tipo_archivo' => $file->getClientOriginalExtension(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Archivo subido con éxito'], 201);
    }
}
