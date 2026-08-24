<?php

namespace App\Services\Implements;

use App\Models\Asistencia;
use App\Models\Docente;
use App\Models\Estudiante;
use App\Models\HorarioAsistencia;
use App\Models\User;
use App\Jobs\NotificarAsistenciaPadres;
use Carbon\Carbon;
use App\Repositories\Interfaces\AsistenciaRepositoryInterface;
use App\Services\Interfaces\AsistenciaServiceInterface;
use Illuminate\Support\Facades\Auth;

class AsistenciaService implements AsistenciaServiceInterface
{
    public function __construct(
        private readonly AsistenciaRepositoryInterface $repository,
        private readonly \App\Services\Interfaces\RhAsistenciaPersonalServiceInterface $rhService,
        private readonly HorarioResolverService $horarioResolver
    ) {
    }

    /**
     * Avisa por WhatsApp a los apoderados. Solo aplica a estudiantes y
     * respeta los interruptores de config/whatsapp.php.
     *
     * Se encola: nunca debe demorar ni romper el marcado de asistencia.
     */
    private function notificarApoderados(string $tipo, int $idPersona, string $tipoMarcado, string $hora): void
    {
        if ($tipo !== 'E') {
            return;
        }

        $activo = $tipoMarcado === 'entrada'
            ? config('whatsapp.asistencia.notificar_entrada')
            : config('whatsapp.asistencia.notificar_salida');

        if (! $activo) {
            return;
        }

        NotificarAsistenciaPadres::dispatch($idPersona, $tipoMarcado, $hora);
    }

    public function calendarioPersona(int $instiId, int $personaId, string $tipo, int $anio, int $mes): array
    {
        $registros = $this->repository->getPorPersonaMes($instiId, $personaId, $tipo, $anio, $mes);

        // Convertir a formato de calendario: { "2026-03-10": { estado, turno, hora_entrada, hora_salida } }
        $calendario = [];
        foreach ($registros as $r) {
            $key = $r->fecha->format('Y-m-d');
            $calendario[$key][] = [
                'asistencia_id' => $r->asistencia_id,
                'estado' => $r->estado,
                'turno' => $r->turno,
                'hora_entrada' => $r->hora_entrada,
                'hora_salida' => $r->hora_salida,
                'observacion' => $r->observacion,
            ];
        }

        return $calendario;
    }

    public function reporteMes(int $instiId, string $tipo, int $anio, int $mes, array $filters = []): array
    {
        $registros = $this->repository->getReporteMes($instiId, $tipo, $anio, $mes, $filters);

        // Agrupar por persona
        $reporte = [];
        foreach ($registros as $r) {
            $id = $r->id_persona;
            $perfil = $tipo === 'E'
                ? $r->estudiante?->perfil
                : $r->docente?->perfil;

            if (!isset($reporte[$id])) {
                $reporte[$id] = [
                    'id_persona' => $id,
                    'nombre_completo' => $perfil
                        ? trim("{$perfil->primer_nombre} {$perfil->segundo_nombre} {$perfil->apellido_paterno} {$perfil->apellido_materno}")
                        : "ID {$id}",
                    'asistencias' => [],
                    'total_asistio' => 0,
                    'total_falto' => 0,
                    'total_tardanza' => 0,
                ];
            }

            $fecha = $r->fecha->format('Y-m-d');
            $reporte[$id]['asistencias'][$fecha] = $r->estado;

            match ($r->estado) {
                '1' => $reporte[$id]['total_asistio']++,
                '0' => $reporte[$id]['total_falto']++,
                'T' => $reporte[$id]['total_tardanza']++,
                default => null,
            };
        }

        return array_values($reporte);
    }

    /**
     * @inheritDoc
     */
    public function marcarPorQR(string $qrData, string $tipoMarcado): array
    {
        $idPersona = null;
        $tipo = 'P'; // Default to Personal
        $user = null;

        // Backward Compatibility Check: Old format was "id,tipo" (e.g. "123,1")
        if (str_contains($qrData, ',')) {
            $parts = explode(',', $qrData);
            if (count($parts) === 2) {
                $rawId = (int) $parts[0];
                $legacyType = $parts[1]; // 1 for student usually

                if ($legacyType == 1) {
                    $tipo = 'E';
                    $persona = Estudiante::with('user.perfil')->find($rawId);
                    $idPersona = $rawId;
                    $user = $persona?->user;
                } else {
                    $tipo = 'D';
                    $persona = Docente::with('user.perfil')->where('docente_id', $rawId)->first();
                    $idPersona = $rawId;
                    $user = $persona?->user;
                }
            }
        } else {
            // New unified format: just user_id
            $userId = (int) $qrData;
            $user = User::with(['perfil'])->find($userId);

            if ($user) {
                $personaEstu = Estudiante::where('user_id', $user->id)->first();
                if ($personaEstu) {
                    $tipo = 'E';
                    $idPersona = $personaEstu->estu_id;
                } else {
                    $personaDoc = Docente::where('id_usuario', $user->id)->first();
                    if ($personaDoc) {
                        $tipo = 'D';
                        $idPersona = $personaDoc->docente_id;
                    } else {
                        $tipo = 'P';
                        $idPersona = $user->id;
                    }
                }
            }
        }

        if (!$idPersona || !$user) {
            throw new \Exception("Usuario o registro no encontrado para este código.");
        }

        $fecha = now()->toDateString();
        $hora = now()->toTimeString();
        $instiId = $user->insti_id ?? 1;

        $horario = null;
        $estado = '1';
        $turno = 'M';

        if ($user->es_trabajador) {
            try {
                $horario = $this->horarioResolver->resolverParaTrabajador($user->id, $instiId);
                $turno = $horario->turno;
                
                $horaLimite = Carbon::parse($horario->hora_ingreso)->addMinutes($horario->minutos_tolerancia ?? 0);
                if (Carbon::parse($hora)->greaterThan($horaLimite)) {
                    $estado = 'T';
                }
            } catch (\Exception $e) {
                // Fallback si no hay horario configurado para este momento
                $turno = now()->hour < 13 ? 'M' : 'T';
            }
        } else {
            // Lógica para estudiantes (basada en nivel si existe)
            $horario = $user->horarioAsistencia; // Fallback actual
            $turno = now()->hour < 13 ? 'M' : 'T';
            
            if ($horario) {
                $horaLimite = Carbon::parse($horario->hora_ingreso)->addMinutes($horario->minutos_tolerancia ?? 0);
                if (Carbon::parse($hora)->greaterThan($horaLimite)) {
                    $estado = 'T';
                }
            }
        }

        $payload = [
            'insti_id'   => $instiId,
            'id_persona' => $idPersona,
            'tipo'       => $tipo,
            'fecha'      => $fecha,
            'turno'      => $turno,
        ];

        if ($tipoMarcado === 'entrada') {
            $payload['hora_entrada'] = $hora;
            $payload['estado']       = $estado;
        } else {
            $payload['hora_salida'] = $hora;
        }

        $asistencia = $this->repository->marcar($payload);

        $this->notificarApoderados($tipo, $idPersona, $tipoMarcado, $hora);

        // --- AUTOMATIC SYNC WITH RH IF WORKER ---
        if ($user->es_trabajador && $tipoMarcado === 'entrada') {
            try {
                $this->rhService->registrarEntrada($user->id, $instiId);
            } catch (\Exception $e) {
                // Already marked or other HR logic errors handled here
            }
        } elseif ($user->es_trabajador && $tipoMarcado === 'salida') {
            try {
                $this->rhService->registrarSalida($user->id);
            } catch (\Exception $e) {
                // Handle
            }
        }

        return [
            'message' => ($tipoMarcado === 'entrada' ? 'Entrada' : 'Salida') . ' registrada correctamente',
            'user'    => $user->perfil,
            'hora'    => $hora,
            'turno'   => $asistencia->turno_label,
        ];
    }

    /**
     * @inheritDoc
     */
    public function marcarPorDni(string $dni, string $tipoMarcado): array
    {
        // Buscar usuario por número de documento en perfiles
        $perfil = \App\Models\Perfil::where('doc_numero', $dni)->first();

        if (!$perfil) {
            throw new \Exception("No se encontró ninguna persona con DNI: {$dni}");
        }

        $user = User::with(['perfil'])->find($perfil->user_id);

        if (!$user) {
            throw new \Exception("Usuario no encontrado para DNI: {$dni}");
        }

        // Determinar tipo (E = Estudiante, D = Docente, P = Personal)
        $personaEstu = Estudiante::where('user_id', $user->id)->first();
        if ($personaEstu) {
            $tipo = 'E';
            $idPersona = $personaEstu->estu_id;
        } else {
            $personaDoc = Docente::where('id_usuario', $user->id)->first();
            if ($personaDoc) {
                $tipo = 'D';
                $idPersona = $personaDoc->docente_id;
            } else {
                $tipo = 'P';
                $idPersona = $user->id;
            }
        }

        $fecha = now()->toDateString();
        $hora = now()->toTimeString();
        $instiId = $user->insti_id ?? 1;

        $horario = null;
        $estado = '1';
        $turno = 'M';

        if ($user->es_trabajador) {
            try {
                $horario = $this->horarioResolver->resolverParaTrabajador($user->id, $instiId);
                $turno = $horario->turno;
                
                $horaLimite = Carbon::parse($horario->hora_ingreso)->addMinutes($horario->minutos_tolerancia ?? 0);
                if (Carbon::parse($hora)->greaterThan($horaLimite)) {
                    $estado = 'T';
                }
            } catch (\Exception $e) {
                // Fallback si no hay horario configurado para este momento
                $turno = now()->hour < 13 ? 'M' : 'T';
            }
        } else {
            // Lógica para estudiantes (basada en nivel si existe)
            $horario = $user->horarioAsistencia; // Fallback actual
            $turno = now()->hour < 13 ? 'M' : 'T';
            
            if ($horario) {
                $horaLimite = Carbon::parse($horario->hora_ingreso)->addMinutes($horario->minutos_tolerancia ?? 0);
                if (Carbon::parse($hora)->greaterThan($horaLimite)) {
                    $estado = 'T';
                }
            }
        }

        $payload = [
            'insti_id' => $instiId,
            'id_persona' => $idPersona,
            'tipo' => $tipo,
            'fecha' => $fecha,
            'turno' => $turno,
        ];

        if ($tipoMarcado === 'entrada') {
            $payload['hora_entrada'] = $hora;
            $payload['estado'] = $estado;
        } else {
            $payload['hora_salida'] = $hora;
        }

        $asistencia = $this->repository->marcar($payload);

        $this->notificarApoderados($tipo, $idPersona, $tipoMarcado, $hora);

        // --- AUTOMATIC SYNC WITH RH IF WORKER ---
        if ($user->es_trabajador && $tipoMarcado === 'entrada') {
            try {
                $this->rhService->registrarEntrada($user->id, $instiId);
            } catch (\Exception $e) {
                // Already marked
            }
        } elseif ($user->es_trabajador && $tipoMarcado === 'salida') {
            try {
                $this->rhService->registrarSalida($user->id);
            } catch (\Exception $e) {
                // Handle
            }
        }

        return [
            'message' => ($tipoMarcado === 'entrada' ? 'Entrada' : 'Salida') . ' registrada correctamente',
            'user' => $user->perfil,
            'hora' => $hora,
            'turno' => $asistencia->turno_label,
            'tipo' => $tipo,
            'nombre' => trim("{$user->perfil?->primer_nombre} {$user->perfil?->apellido_paterno}"),
        ];
    }

    /**
     * @inheritDoc
     */
    public function getHistorialConNombres(int $limit = 20): array
    {
        $logs = $this->repository->getHistorialGlobal($limit);

        return $logs->map(function ($log) {
            $persona = null;
            if ($log->tipo === 'E') {
                $persona = Estudiante::with('perfil')->find($log->id_persona);
            } elseif ($log->tipo === 'D') {
                $persona = Docente::with('perfil')->find($log->id_persona);
            } else {
                $persona = User::with('perfil')->find($log->id_persona);
            }

            $perfil = $persona?->perfil;

            $log->usuario_nombre = $perfil
                ? trim("{$perfil->primer_nombre} {$perfil->apellido_paterno}")
                : ($persona instanceof User ? ($persona->name ?? '—') : ($persona?->getNombreCompletoAttribute() ?? '—'));

            return $log;
        })->toArray();
    }

    /**
     * @inheritDoc
     */
    public function exportarExcelPersona(int $id, string $tipo, array $filters): array
    {
        // This will be implemented if we decide to keep Excel logic in Service
        // For now, let's keep the DTO/Data preparation here.
        $fechaInicio = $filters['fecha_inicio'] ?? null;
        $fechaFin = $filters['fecha_fin'] ?? null;
        $mes = $filters['mes'] ?? date('m');
        $anio = $filters['anio'] ?? date('Y');

        if ($fechaInicio && $fechaFin) {
            $logs = $this->repository->getPorPersonaRango($id, $tipo, $fechaInicio, $fechaFin);
            $label = date('d/m/Y', strtotime($fechaInicio)) . ' - ' . date('d/m/Y', strtotime($fechaFin));
        } else {
            $logs = $this->repository->getPorPersonaMes(1, $id, $tipo, (int) $anio, (int) $mes);
            $label = "Mes {$mes}/{$anio}";
        }

        $nombre = 'Usuario';
        if ($tipo === 'E') {
            $p = Estudiante::with('perfil')->find($id);
            if ($p)
                $nombre = "{$p->perfil->primer_nombre} {$p->perfil->apellido_paterno}";
        } else {
            $p = Docente::with('perfil')->find($id);
            if ($p)
                $nombre = "{$p->perfil->primer_nombre} {$p->perfil->apellido_paterno}";
        }

        return [
            'logs' => $logs,
            'nombre' => $nombre,
            'label' => $label,
        ];
    }

    public function eliminar(int $id): void
    {
        $this->repository->eliminar($id);
    }
}
