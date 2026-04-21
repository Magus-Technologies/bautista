<?php

namespace App\Services\Notifications;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class NotificationService
{
    private const CACHE_TTL = 120; // 2 minutos

    public function __construct(
        private EstudianteNotification $estudiante,
        private PadreNotification      $padre,
        private DocenteNotification    $docente,
        private AdminNotification      $admin,
    ) {}

    public function forEstudiante(User $user): array
    {
        return Cache::store('database')->remember(
            "notif_est_{$user->id}",
            self::CACHE_TTL,
            fn() => $this->estudiante->build($user)
        );
    }

    public function forPadre(User $user): array
    {
        return Cache::store('database')->remember(
            "notif_padre_{$user->id}",
            self::CACHE_TTL,
            fn() => $this->padre->build($user)
        );
    }

    public function forDocente(User $user): array
    {
        return Cache::store('database')->remember(
            "notif_doc_{$user->id}",
            self::CACHE_TTL,
            fn() => $this->docente->build($user)
        );
    }

    public function forAdmin(User $user, int $instiId): array
    {
        return Cache::store('database')->remember(
            "notif_admin_{$user->id}",
            self::CACHE_TTL,
            fn() => $this->admin->build($user, $instiId)
        );
    }
}
