<?php

namespace App\Http\Middleware;

use App\Services\Billing\TenantBillingService;
use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnforceTenantBillingState
{
    public function __construct(
        private readonly TenantBillingService $billing,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $tenant = app(TenantContext::class)->tenant();
        $host = strtolower((string) $request->getHost());
        $centralDomains = Arr::wrap(config('saas.central_domains', []));

        if (!$tenant || in_array($host, $centralDomains, true)) {
            return $next($request);
        }

        $state = $this->billing->billingStateFor($tenant);
        $routeName = (string) ($request->route()?->getName() ?? '');
        $isAdminArea = str_starts_with($routeName, 'admin.') || str_starts_with($routeName, 'client.');
        $isAuthRoute = in_array($routeName, ['login', 'logout'], true);
        $isSafeMethod = in_array($request->getMethod(), ['GET', 'HEAD', 'OPTIONS'], true);
        $user = $request->user();

        if (!$state['allow_front'] && !$isAdminArea && !$isAuthRoute) {
            return Inertia::render('Public/TenantUnavailable', [
                'tenant' => [
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                ],
            ])->toResponse($request)->setStatusCode(404);
        }

        if ($user && !$user->isDeveloper() && !$isSafeMethod && !$state['allow_write']) {
            return redirect()->back()->with('error', 'Esta cuenta esta en modo restringido. Puedes revisar el panel, pero no subir ni modificar contenido hasta normalizar el pago.');
        }

        return $next($request);
    }
}