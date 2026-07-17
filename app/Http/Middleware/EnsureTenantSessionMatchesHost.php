<?php

namespace App\Http\Middleware;

use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantSessionMatchesHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $guard = app(TenantContext::class)->guard();
        $user  = Auth::guard($guard)->user();

        if (! $user) {
            return $next($request);
        }

        $tenantId     = app(TenantContext::class)->id();
        $host         = strtolower((string) $request->getHost());
        $centralDomains = Arr::wrap(config('saas.central_domains', []));
        $routeName    = (string) $request->route()?->getName();

        // SaaS panel: developer role validation is handled by EnsureDeveloper middleware.
        $panelDomain = strtolower((string) config('saas.panel_domain', ''));
        if ($panelDomain && $host === $panelDomain) {
            return $next($request);
        }

        // Developer accounts have no tenant_id — they can operate globally.
        if ($user->tenant_id === null && $user->isDeveloper()) {
            return $next($request);
        }

        if (in_array($host, $centralDomains, true) && $user->tenant_id === null) {
            return $next($request);
        }

        // External collaborators access projects via invitation tokens.
        if (str_starts_with($routeName, 'project.invitations.')) {
            return $next($request);
        }

        if ($tenantId !== null && (int) ($user->tenant_id ?? 0) === (int) $tenantId) {
            return $next($request);
        }

        if ($tenantId !== null && $user->hasActiveProjectAccessForTenant((int) $tenantId)) {
            return $next($request);
        }

        // Session belongs to a different tenant or domain — log the user out of this guard only.
        Auth::guard($guard)->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()
            ->route('login', ['s' => $guard])
            ->with('error', 'Tu sesion pertenece a otra cuenta o dominio. Ingresa con el acceso correcto de este estudio.');
    }
}
