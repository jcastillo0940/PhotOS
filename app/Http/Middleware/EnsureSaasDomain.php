<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSaasDomain
{
    public function handle(Request $request, Closure $next): Response
    {
        $panelDomain = config('saas.panel_domain');

        // Sin dominio configurado (entorno local) se permite siempre.
        if (! $panelDomain) {
            return $next($request);
        }

        $host = strtolower((string) $request->getHost());

        if ($host !== strtolower((string) $panelDomain)) {
            abort(404);
        }

        return $next($request);
    }
}
