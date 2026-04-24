<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use App\Services\ActividadUsuarioService;
use App\Services\Interfaces\UsuarioServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UsuarioApiController extends Controller
{
    public function __construct(
        private readonly UsuarioServiceInterface $service,
        private readonly ActividadUsuarioService $auditoria,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->service->listar(
            instiId: $request->user()->insti_id,
            search:  $request->get('search') ?? '',
            esTrabajador: $request->boolean('es_trabajador'),
            perPage: (int) $request->get('per_page', 20),
        );

        return response()->json([
            'data'         => UsuarioResource::collection($paginated->items()),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'per_page'     => $paginated->perPage(),
            'total'        => $paginated->total(),
            'from'         => $paginated->firstItem(),
            'to'           => $paginated->lastItem(),
        ]);
    }

    public function show(int $id): UsuarioResource
    {
        return new UsuarioResource($this->service->obtener($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username'         => ['required', 'string', 'max:100', Rule::unique('users', 'username')],
            'email'            => ['nullable', 'email', 'max:150'],
            'primer_nombre'    => ['required', 'string', 'max:100'],
            'segundo_nombre'   => ['nullable', 'string', 'max:100'],
            'apellido_paterno' => ['required', 'string', 'max:100'],
            'apellido_materno' => ['nullable', 'string', 'max:100'],
            'genero'           => ['nullable', 'in:M,F'],
            'tipo_doc'         => ['nullable', 'integer', 'in:1,2,3,4'],
            'doc_numero'       => ['nullable', 'string', 'max:30'],
            'fecha_nacimiento' => ['nullable', 'date'],
            'telefono'         => ['nullable', 'string', 'max:50'],
            'direccion'        => ['nullable', 'string', 'max:200'],
            'rol'              => ['nullable', 'string', Rule::exists('roles', 'name')],
        ]);

        $data['insti_id'] = $request->user()->insti_id;

        // Determinar automáticamente si es trabajador según el rol
        $data['es_trabajador'] = in_array($data['rol'] ?? '', ['docente', 'rh']);

        $user = $this->service->crear($data);

        return (new UsuarioResource($user))
            ->response()
            ->setStatusCode(201);
    }

    public function historial(int $id): JsonResponse
    {
        $user = $this->service->obtener($id);
        $historial = $user->loginHistories()
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($h) => [
                'id'         => $h->id,
                'fecha'      => $h->created_at?->format('Y-m-d'),
                'hora'       => $h->created_at?->format('H:i'),
                'tipo'       => $h->tipo === '1' ? 'Login' : 'Logout',
                'ip_address' => $h->ip_address,
                'device'     => $h->device ?? '—',
                'isp'        => $h->isp ?? '—',
            ]);
        return response()->json($historial);
    }

    public function actividad(int $id): JsonResponse
    {
        $this->service->obtener($id); // valida que el usuario existe

        $actividad = $this->auditoria->historialDeUsuario($id)
            ->map(fn ($a) => [
                'id'          => $a->id,
                'accion'      => $a->accion,
                'entidad'     => $a->entidad,
                'entidad_id'  => $a->entidad_id,
                'descripcion' => $a->descripcion,
                'ip'          => $a->ip,
                'fecha'       => $a->created_at?->format('Y-m-d'),
                'hora'        => $a->created_at?->format('H:i'),
            ]);

        return response()->json($actividad);
    }

    public function resetCredenciales(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:100', Rule::unique('users', 'username')->ignore($id)],
            'password' => ['required', 'string', 'min:6'],
        ]);
        $this->service->actualizar($id, $data);
        return response()->json(['ok' => true]);
    }

    public function toggleEstado(int $id): JsonResponse
    {
        $user = $this->service->obtener($id);
        $nuevoEstado = $user->estado === '5' ? '1' : '5';
        $this->service->actualizar($id, ['estado' => $nuevoEstado]);
        return response()->json(['estado' => $nuevoEstado]);
    }

    public function update(Request $request, int $id): UsuarioResource
    {
        $data = $request->validate([
            'username'         => ['required', 'string', 'max:100', Rule::unique('users', 'username')->ignore($id)],
            'email'            => ['nullable', 'email', 'max:150'],
            'primer_nombre'    => ['required', 'string', 'max:100'],
            'segundo_nombre'   => ['nullable', 'string', 'max:100'],
            'apellido_paterno' => ['required', 'string', 'max:100'],
            'apellido_materno' => ['nullable', 'string', 'max:100'],
            'genero'           => ['nullable', 'in:M,F'],
            'tipo_doc'         => ['nullable', 'integer', 'in:1,2,3,4'],
            'doc_numero'       => ['nullable', 'string', 'max:30'],
            'fecha_nacimiento' => ['nullable', 'date'],
            'telefono'         => ['nullable', 'string', 'max:50'],
            'direccion'        => ['nullable', 'string', 'max:200'],
            'estado'           => ['nullable', 'in:1,0,5'],
            'rol'              => ['nullable', 'string', Rule::exists('roles', 'name')],
        ]);

        // Determinar automáticamente si es trabajador según el rol
        $data['es_trabajador'] = in_array($data['rol'] ?? '', ['docente', 'rh']);

        return new UsuarioResource($this->service->actualizar($id, $data));
    }
}
