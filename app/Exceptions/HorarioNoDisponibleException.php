<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class HorarioNoDisponibleException extends Exception
{
    public function __construct(string $horaActual, ?int $rolId = null)
    {
        $rol = $rolId ? " (rol_id: {$rolId})" : '';
        parent::__construct(
            "No existe un horario activo{$rol} para este momento. " .
            "Hora actual: {$horaActual}. " .
            "Intente marcar dentro de la ventana de ±2 horas del horario configurado."
        );
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'code'    => 'HORARIO_NO_DISPONIBLE',
        ], 422);
    }
}
