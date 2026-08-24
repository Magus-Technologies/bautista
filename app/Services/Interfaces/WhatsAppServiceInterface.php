<?php

namespace App\Services\Interfaces;

interface WhatsAppServiceInterface
{
    /**
     * Encola un mensaje en el microservicio de WhatsApp.
     *
     * Devuelve false si el envío está deshabilitado o el servicio no responde;
     * nunca lanza excepción, para no romper el flujo que lo invoca.
     */
    public function enviar(string $telefono, string $mensaje): bool;

    /**
     * Estado de la conexión del microservicio (conectado, esperando-qr, etc.).
     *
     * @return array{estado: string, en_cola: int, qr: ?string}
     */
    public function estado(): array;

    /**
     * Cierra la sesión de WhatsApp y fuerza un QR nuevo.
     */
    public function desvincular(): bool;
}
