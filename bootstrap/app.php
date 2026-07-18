<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use App\Http\Middleware\EnsureClientRole;
use App\Http\Middleware\EnsureSaasDomain;
use App\Http\Middleware\EnsureTenantFeatureAvailable;
use App\Http\Middleware\EnsureTenantSessionMatchesHost;
use App\Http\Middleware\EnsureDeveloper;
use App\Http\Middleware\EnsureStudioOperator;
use App\Http\Middleware\EnsureTenantAdmin;
use App\Http\Middleware\EnsureTenantFinance;
use App\Http\Middleware\EnsureProjectAccess;
use App\Http\Middleware\GeminiRateLimit;
use App\Http\Middleware\EnforceTenantBillingState;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ResolveApiTenant;
use App\Http\Middleware\ResolveTenantFromHost;
use App\Http\Middleware\SecurityHeaders;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            \Illuminate\Support\Facades\Route::middleware('web')
                ->group(base_path('routes/saas.php'));

            \Illuminate\Support\Facades\Route::middleware('api')
                ->group(base_path('routes/api.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'api.tenant'     => ResolveApiTenant::class,
            'developer'      => EnsureDeveloper::class,
            'saas.domain'    => EnsureSaasDomain::class,
            'client.role'    => EnsureClientRole::class,
            'studio.operator' => EnsureStudioOperator::class,
            'tenant.admin'   => EnsureTenantAdmin::class,
            'tenant.finance' => EnsureTenantFinance::class,
            'project.access' => EnsureProjectAccess::class,
            'tenant.feature' => EnsureTenantFeatureAvailable::class,
            'gemini.rate'    => GeminiRateLimit::class,
        ]);

        $middleware->web(
            prepend: [
                SecurityHeaders::class,
                ResolveTenantFromHost::class,
            ],
            append: [
                HandleInertiaRequests::class,
                EnforceTenantBillingState::class,
                EnsureTenantSessionMatchesHost::class,
            ],
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Redirect unauthenticated users to the login page for their surface.
        // The ?s= param ensures the correct session cookie is loaded at /login.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'No autenticado.'], 401);
            }

            $guards  = $e->guards();
            $surface = match (true) {
                in_array('client', $guards, true) => 'client',
                in_array('saas', $guards, true)   => 'saas',
                default                           => 'studio',
            };

            return redirect()->guest(route('login', ['s' => $surface]));
        });
    })->create();

$app->usePublicPath($app->basePath('public_html'));

return $app;
