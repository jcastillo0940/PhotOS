<?php

namespace App\Http\Middleware;

use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantFeatureAvailable
{
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $tenant = app(TenantContext::class)->tenant();

        if (!$tenant) {
            return $next($request);
        }

        if (!$tenant->canUseFeature($feature)) {
            return redirect()->back()->with('error', 'Tu plan actual alcanzo el limite disponible para esta funcion.');
        }

        return $next($request);
    }
}