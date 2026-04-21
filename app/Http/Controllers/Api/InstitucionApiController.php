<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInstitucionRequest;
use App\Http\Requests\UpdateInstitucionRequest;
use App\Http\Resources\InstitucionResource;
use App\Services\Interfaces\InstitucionServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class InstitucionApiController extends Controller
{
    public function __construct(
        private readonly InstitucionServiceInterface $service,
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
        $data = $request->safe()->except('logo');

        if ($request->hasFile('logo')) {
            $institucion = $this->service->obtener($id);
            if ($institucion->insti_logo) {
                Storage::disk('public')->delete($institucion->insti_logo);
            }
            $data['insti_logo'] = $this->subirLogo($request, $data['insti_ruc'] ?? 'logo');
        }

        return new InstitucionResource($this->service->actualizar($id, $data));
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->eliminar($id);

        return response()->json(null, 204);
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
