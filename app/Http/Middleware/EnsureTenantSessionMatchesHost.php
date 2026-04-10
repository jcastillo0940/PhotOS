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
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $tenantId = app(TenantContext::class)->id();
        $host = strtolower((string) $request->getHost());
        $centralDomains = Arr::wrap(config('saas.central_domains', []));

        if (in_array($host, $centralDomains, true) && $user->isDeveloper()) {
            return $next($request);
        }

        if ($tenantId !== null && (int) ($user->tenant_id ?? 0) === (int) $tenantId) {
            return $next($request);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()
            ->route('login')
            ->with('error', 'Tu sesion pertenece a otra cuenta o dominio. Ingresa con el acceso correcto de este estudio.');
    }
}
