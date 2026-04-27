<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Laravel\Sanctum\PersonalAccessToken;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $this->resolveUser($request);

        return [
            ...parent::share($request),
            'name'        => config('app.name'),
            'auth'        => [
                'user' => $user,
            ],
            'branding'    => function () use ($user) {
                $institucion = $user ? $user->institucion : \App\Models\InstitucionEducativa::first();

                if (!$institucion) return null;

                return [
                    'logo'       => $institucion->insti_logo       ? asset('storage/' . $institucion->insti_logo)       : null,
                    'background' => $institucion->insti_fondo_login ? asset('storage/' . $institucion->insti_fondo_login) : null,
                ];
            },
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    private function resolveUser(Request $request): mixed
    {
        $userModel = null;

        if ($request->user()) {
            $userModel = $request->user();
        } elseif ($tokenCookie = $request->cookie('auth_token')) {
            $token = PersonalAccessToken::findToken($tokenCookie);
            if ($token && $token->tokenable) {
                $userModel = $token->tokenable;
            }
        }

        if ($userModel) {
            $userModel->load('perfil', 'rol', 'docente');
            $userModel->setAttribute('can_list', $userModel->getAllPermissions()->pluck('name'));
            $userModel->setAttribute('role_list', $userModel->getRoleNames());
            $userModel->setAttribute('es_trabajador', $userModel->roles()->where('es_trabajador', true)->exists());
        }

        return $userModel;
    }
}
