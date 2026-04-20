<?php

namespace App\Services\Interfaces;

use Illuminate\Database\Eloquent\Collection;

interface AsistenciaServiceInterface
{
    /** Calendario mensual de un alumno o docente. */
    public function calendarioPersona(int $instiId, int $personaId, string $tipo, int $anio, int $mes): array;

    /** Reporte mensual de toda la institución. */
    public function reporteMes(int $instiId, string $tipo, int $anio, int $mes, array $filters = []): array;

    /** Marcar asistencia vía QR (Soporta formato nuevo y antiguo). */
    public function marcarPorQR(string $qrData, string $tipoMarcado): array;

    /** Marcar asistencia vía número de documento (DNI). */
    public function marcarPorDni(string $dni, string $tipoMarcado): array;

    /** Obtener historial reciente con nombres de usuarios ya resueltos. */
    public function getHistorialConNombres(int $limit = 20): array;

    /** Exportar historial a Excel para una persona. */
    public function exportarExcelPersona(int $id, string $tipo, array $filters): array;

    /** Eliminar un registro. */
    public function eliminar(int $id): void;
}
