<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantFinance
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user && ($user->isDeveloper() || $user->isOwner()), 403, 'Solo el owner puede gestionar facturacion y pagos.');

        return $next($request);
    }
}
