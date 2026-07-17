<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDeveloper
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'developer') {
            abort(403, 'Solo un usuario con acceso total puede acceder a esta seccion.');
        }

        // Si el developer intenta acceder al backoffice de estudio (admin.*)
        // desde el dominio correcto del panel SaaS, lo dejamos pasar para soporte.
        // Si no hay panel_domain configurado (local) también pasa sin restricción.
        $panelDomain = strtolower((string) config('saas.panel_domain', ''));
        $host = strtolower((string) $request->getHost());

        if ($panelDomain && $host !== $panelDomain && str_starts_with((string) $request->route()?->getName(), 'saas.')) {
            abort(404);
        }

        return $next($request);
    }
}
