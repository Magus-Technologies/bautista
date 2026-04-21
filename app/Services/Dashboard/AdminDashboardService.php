<?php

namespace App\Services\Dashboard;

use App\Models\Curso;
use App\Models\Docente;
use App\Models\Estudiante;
use App\Models\InstitucionEducativa;
use App\Models\Matricula;
use App\Models\MensajePrivado;
use App\Models\Pago;
use App\Models\Perfil;
use App\Models\User;
use App\Services\Notifications\NotificationService;
use Illuminate\Support\Facades\Cache;

class AdminDashboardService
{
    public function __construct(private NotificationService $notifService) {}
    public function getStats(User $user): array
    {
        $instiId = $user->insti_id;

        $totales = Cache::store('database')->remember('admin_totales', 300, fn() => [
            'total_instituciones' => InstitucionEducativa::count(),
            'total_docentes'      => Docente::count(),
            'total_estudiantes'   => Estudiante::count(),
            'total_cursos'        => Curso::count(),
        ]);

        return [
            ...$totales,
            'notificaciones'      => $this->getNotifications($user, $instiId),
            'mensajes_pendientes' => $this->getPendingMessages($user),
            'cursos'              => [],
            'stats'               => [
                'tareas_pendientes' => 0,
                'asistencia_perc'   => 0,
                'promedio_general'  => 0
            ],
            'hijos'               => [],
        ];
    }

    private function getNotifications(User $user, int $instiId): array
    {
        return $this->notifService->forAdmin($user, $instiId);
    }

    private function getPendingMessages(User $user): array
    {
        return MensajePrivado::where('destinatario_id', $user->id)
            ->where('leido_destinatario', false)
            ->where('eliminado_destinatario', false)
            ->with(['remitente.perfil', 'remitente.padreApoderado'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($m) {
                $studentName = '-';
                $padre = $m->remitente->padreApoderado;
                if ($padre) {
                    $student = $padre->estudiantes()->first();
                    if ($student && $student->perfil) {
                        $studentName = $student->perfil->nombre_completo;
                    }
                }

                return [
                    'id'            => $m->id,
                    'fecha'         => $m->created_at->format('d/m/Y H:i'),
                    'representante' => $m->remitente->perfil?->nombre_completo ?? $m->remitente->name,
                    'telefono'      => $m->remitente->perfil?->telefono ?? '-',
                    'exalumno'      => $studentName,
                    'asunto'        => $m->asunto,
                ];
            })
            ->toArray();
    }
}
