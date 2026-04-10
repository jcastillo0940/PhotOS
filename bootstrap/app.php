<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\EnsureTenantFeatureAvailable;
use App\Http\Middleware\EnsureTenantSessionMatchesHost;
use App\Http\Middleware\EnsureDeveloper;
use App\Http\Middleware\EnsureStudioOperator;
use App\Http\Middleware\EnsureTenantAdmin;
use App\Http\Middleware\EnsureTenantFinance;
use App\Http\Middleware\EnsureProjectAccess;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ResolveTenantFromHost;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'developer' => EnsureDeveloper::class,
            'studio.operator' => EnsureStudioOperator::class,
            'tenant.admin' => EnsureTenantAdmin::class,
            'tenant.finance' => EnsureTenantFinance::class,
            'project.access' => EnsureProjectAccess::class,
            'tenant.feature' => EnsureTenantFeatureAvailable::class,
        ]);

        $middleware->web(
            prepend: [
                ResolveTenantFromHost::class,
            ],
            append: [
                HandleInertiaRequests::class,
                EnsureTenantSessionMatchesHost::class,
            ],
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

$app->usePublicPath($app->basePath('public_html'));

return $app;
