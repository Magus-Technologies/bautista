<?php

use App\Exceptions\UserInactiveException;
use App\Http\Middleware\AuthenticateWithToken;
use Spatie\Permission\Exceptions\UnauthorizedException;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state', 'auth_token']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'auth.token'              => AuthenticateWithToken::class,
            'check.role'              => \App\Http\Middleware\CheckRole::class,
            'permission'              => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role'                    => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'verify.docente.curso'    => \App\Http\Middleware\VerifyDocenteCurso::class,
            'verify.estudiante.curso' => \App\Http\Middleware\VerifyEstudianteCurso::class,
            'es.trabajador'           => \App\Http\Middleware\CheckEsTrabajador::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (UserInactiveException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        });

        $exceptions->render(function (ModelNotFoundException $e) {
            return response()->json(['message' => 'Recurso no encontrado.'], 404);
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'No autenticado.'], 401);
            }
            return redirect()->route('login');
        });

        $exceptions->render(function (UnauthorizedException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'No tienes permiso para acceder a este recurso.'], 403);
            }
            // En web: redirigir al dashboard propio del rol en lugar de mostrar error 403
            return redirect()->route('dashboard');
        });
    })->create();
