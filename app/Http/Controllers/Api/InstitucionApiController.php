<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInstitucionRequest;
use App\Http\Requests\UpdateInstitucionRequest;
use App\Http\Resources\InstitucionResource;
use App\Services\Interfaces\ComprobanteServiceInterface;
use App\Services\Interfaces\InstitucionServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class InstitucionApiController extends Controller
{
    public function __construct(
        private readonly InstitucionServiceInterface $service,
        private readonly ComprobanteServiceInterface $comprobanteService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return InstitucionResource::collection($this->service->listar(
            search:  $request->get('search') ?? '',
            perPage: (int) $request->get('per_page', 20),
        ));
    }

    public function show(int $id): InstitucionResource
    {
        return new InstitucionResource($this->service->obtener($id));
    }

    public function store(StoreInstitucionRequest $request): JsonResponse
    {
        $data = array_merge($request->safe()->except('logo'), ['insti_estatus' => 1]);

        if ($request->hasFile('logo')) {
            $data['insti_logo'] = $this->subirLogo($request, $data['insti_ruc'] ?? 'logo');
        }

        $institucion = $this->service->crear($data);

        return (new InstitucionResource($institucion))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateInstitucionRequest $request, int $id): InstitucionResource
    {
        $data = $request->safe()->except(['logo', 'certificado']);

        if ($request->hasFile('logo')) {
            $institucion = $this->service->obtener($id);
            if ($institucion->insti_logo) {
                Storage::disk('public')->delete($institucion->insti_logo);
            }
            $data['insti_logo'] = $this->subirLogo($request, $data['insti_ruc'] ?? 'logo');
        }

        $institucion = $this->service->actualizar($id, $data);

        // Si se subió un .pem, enviarlo a la API Magus
        if ($request->hasFile('certificado')) {
            $this->comprobanteService->subirCertificado($id, $request->file('certificado'));
            $institucion = $this->service->obtener($id);
        }

        return new InstitucionResource($institucion);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->eliminar($id);

        return response()->json(null, 204);
    }

    /**
     * GET /api/branding - Obtener logo y fondo para pantalla de login (público)
     */
    public function branding(): JsonResponse
    {
        $institucion = \App\Models\InstitucionEducativa::first();

        if (!$institucion) {
            return response()->json([
                'logo' => null,
                'background' => null,
                'nombre' => 'Sistema de Gestión Educativa',
            ]);
        }

        return response()->json([
            'logo' => $institucion->insti_logo 
                ? asset('storage/' . $institucion->insti_logo) 
                : null,
            'background' => $institucion->insti_fondo_login 
                ? asset('storage/' . $institucion->insti_fondo_login) 
                : null,
            'nombre' => $institucion->insti_razon_social ?? 'Sistema de Gestión Educativa',
        ]);
    }

    private function subirLogo(StoreInstitucionRequest|UpdateInstitucionRequest $request, string $ruc): string
    {
        $file     = $request->file('logo');
        $filename = $ruc . '.' . $file->getClientOriginalExtension();
        $path     = 'instituciones/' . $filename;
        $file->storeAs('instituciones', $filename, 'public');
        return $path;
    }
}
