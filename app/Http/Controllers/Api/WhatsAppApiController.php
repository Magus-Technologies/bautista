<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Interfaces\WhatsAppServiceInterface;
use Illuminate\Http\JsonResponse;

class WhatsAppApiController extends Controller
{
    public function __construct(
        private readonly WhatsAppServiceInterface $whatsapp,
    ) {}

    /**
     * Estado de la conexión, incluido el QR cuando toca vincular.
     */
    public function estado(): JsonResponse
    {
        return response()->json([
            'data' => $this->whatsapp->estado() + [
                'habilitado' => (bool) config('whatsapp.habilitado'),
            ],
        ]);
    }

    /**
     * Cierra la sesión actual para poder vincular otro teléfono.
     */
    public function desvincular(): JsonResponse
    {
        if (! $this->whatsapp->desvincular()) {
            return response()->json([
                'message' => 'No se pudo desvincular. Revisa que el servicio de WhatsApp esté corriendo.',
            ], 503);
        }

        return response()->json(['message' => 'Sesión cerrada. Escanea el nuevo código QR.']);
    }
}
