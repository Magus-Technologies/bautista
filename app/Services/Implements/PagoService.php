<?php

namespace App\Services\Implements;

use App\Models\Pago;
use App\Models\PagoNotifica;
use App\Repositories\Interfaces\PagoNotificaRepositoryInterface;
use App\Repositories\Interfaces\PagoRepositoryInterface;
use App\Services\ActividadUsuarioService;
use App\Services\Interfaces\PagoServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class PagoService implements PagoServiceInterface
{
    public function __construct(
        private readonly PagoRepositoryInterface $repo,
        private readonly PagoNotificaRepositoryInterface $notificaRepo,
        private readonly ActividadUsuarioService $auditoria,
    ) {}

    public function listarEstudiantesConPagador(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        return $this->repo->paginateEstudiantesConPagador($instiId, $search, $perPage);
    }

    public function listarPagadores(int $instiId, string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        return $this->repo->paginatePagadores($instiId, $search, $perPage);
    }

    public function pagosPorContacto(int $contactoId): Collection
    {
        return $this->repo->pagosPorContacto($contactoId);
    }

    public function crearPago(array $data): Pago
    {
        $data['total'] = ($data['pag_monto'] ?? 0)
                       + ($data['pag_otro1'] ?? 0)
                       + ($data['pag_otro2'] ?? 0);

        $data['estatus'] = ($data['pag_monto'] > 0) ? 1 : 0;

        $pago = $this->repo->create($data);
        $this->auditoria->registrar('crear', 'Pago', $pago->pag_id,
            "Pago registrado: S/ {$pago->total} — {$pago->pag_mes} {$pago->pag_anual}");
        return $pago;
    }

    public function actualizarPago(int $id, array $data): Pago
    {
        $pago = $this->repo->findById($id);

        $data['total'] = ($data['pag_monto'] ?? $pago->pag_monto)
                       + ($data['pag_otro1'] ?? $pago->pag_otro1)
                       + ($data['pag_otro2'] ?? $pago->pag_otro2);

        $data['estatus'] = (($data['pag_monto'] ?? $pago->pag_monto) > 0) ? 1 : 0;

        $updated = $this->repo->update($pago, $data);
        $this->auditoria->registrar('actualizar', 'Pago', $id,
            "Pago actualizado: S/ {$updated->total} — {$updated->pag_mes} {$updated->pag_anual}");
        return $updated;
    }

    public function eliminarPago(int $id): void
    {
        $pago = $this->repo->findById($id);
        $this->auditoria->registrar('eliminar', 'Pago', $id,
            "Pago eliminado: S/ {$pago->total} — {$pago->pag_mes} {$pago->pag_anual}");
        $this->repo->delete($pago);
    }

    /**
     * Vouchers / Notificaciones de Pago
     */
    public function subirVoucher(int $pagoId, int $userId, UploadedFile $archivo): PagoNotifica
    {
        $pago = $this->repo->findById($pagoId);
        
        // Almacenar el archivo de forma segura
        $path = $archivo->store('vouchers', 'public');

        $notifica = $this->notificaRepo->create([
            'pag_id'  => $pagoId,
            'user_id' => $userId,
            'archivo' => $path,
            'estado'  => 'Pendiente',
        ]);

        $this->auditoria->registrar('subir_voucher', 'PagoNotifica', $notifica->id,
            "Voucher cargado para Pago ID: {$pagoId} — {$pago->pag_mes} {$pago->pag_anual}");

        return $notifica;
    }

    public function listarVouchers(int $pagoId): Collection
    {
        return $this->notificaRepo->porPago($pagoId);
    }

    public function validarVoucher(int $notificaId, string $estado, ?string $comentario): PagoNotifica
    {
        $notifica = $this->notificaRepo->findById($notificaId);
        $updated  = $this->notificaRepo->actualizarEstado($notifica, $estado, $comentario);

        // Si se aprueba el voucher, marcamos el pago como pagado si aún no lo está
        if ($estado === 'validado') {
            $pago = $this->repo->findById($notifica->pag_id);
            if ($pago->estatus !== 1) {
                $this->repo->update($pago, ['estatus' => 1]);
            }
        }

        $this->auditoria->registrar('validar_voucher', 'PagoNotifica', $notificaId,
            "Voucher procesado: {$estado}. Comentario: " . ($comentario ?? 'Ninguno'));

        return $updated;
    }

    public function dashboard(int $instiId, string $mes, int $anio): array
    {
        return $this->repo->dashboard($instiId, $mes, $anio);
    }

    public function vencidos(int $instiId): Collection
    {
        return $this->repo->vencidos($instiId);
    }

    public function generarMensualidades(int $instiId, string $mes, int $anio): array
    {
        $resultado = $this->repo->crearMensualidades($instiId, $mes, $anio);

        $this->auditoria->registrar('generar_mensualidades', 'Pago', 0,
            "Mensualidades {$mes} {$anio}: {$resultado['creados']} creadas, {$resultado['omitidos']} omitidas.");

        return $resultado;
    }

    public function historialAlumno(int $instiId, int $estuId): array
    {
        return $this->repo->historialAlumno($instiId, $estuId);
    }

    public function reporteConsolidado(int $instiId, string $mes, int $anio): array
    {
        return $this->repo->reporteConsolidado($instiId, $mes, $anio);
    }
}