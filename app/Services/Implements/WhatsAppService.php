<?php

namespace App\Services\Implements;

use App\Services\Interfaces\WhatsAppServiceInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService implements WhatsAppServiceInterface
{
    /**
     * @inheritDoc
     */
    public function enviar(string $telefono, string $mensaje): bool
    {
        if (! config('whatsapp.habilitado')) {
            Log::info('WhatsApp deshabilitado, mensaje no enviado', [
                'telefono' => $telefono,
            ]);

            return false;
        }

        try {
            $respuesta = Http::timeout(config('whatsapp.timeout'))
                ->withHeaders(['X-Token' => config('whatsapp.token')])
                ->post(config('whatsapp.url').'/enviar', [
                    'telefono' => $telefono,
                    'mensaje' => $mensaje,
                ]);

            if ($respuesta->failed()) {
                Log::warning('WhatsApp rechazó el mensaje', [
                    'telefono' => $telefono,
                    'status' => $respuesta->status(),
                    'body' => $respuesta->body(),
                ]);

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('No se pudo contactar el servicio de WhatsApp', [
                'telefono' => $telefono,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * @inheritDoc
     */
    public function estado(): array
    {
        try {
            $respuesta = Http::timeout(config('whatsapp.timeout'))
                ->get(config('whatsapp.url').'/estado');

            if ($respuesta->successful()) {
                return [
                    'estado' => $respuesta->json('estado', 'desconocido'),
                    'en_cola' => (int) $respuesta->json('en_cola', 0),
                    'qr' => $respuesta->json('qr'),
                ];
            }
        } catch (\Throwable $e) {
            Log::error('No se pudo consultar el estado de WhatsApp', [
                'error' => $e->getMessage(),
            ]);
        }

        return ['estado' => 'sin-servicio', 'en_cola' => 0, 'qr' => null];
    }

    /**
     * @inheritDoc
     */
    public function desvincular(): bool
    {
        try {
            return Http::timeout(config('whatsapp.timeout'))
                ->withHeaders(['X-Token' => config('whatsapp.token')])
                ->post(config('whatsapp.url').'/desvincular')
                ->successful();
        } catch (\Throwable $e) {
            Log::error('No se pudo desvincular WhatsApp', ['error' => $e->getMessage()]);

            return false;
        }
    }
}
