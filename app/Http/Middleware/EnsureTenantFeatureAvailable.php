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

        if (! $tenant) {
            return $next($request);
        }

        if (! $tenant->canUseFeature($feature)) {
            return redirect()->back()->with('error', $this->messageFor($tenant, $feature));
        }

        return $next($request);
    }

    private function messageFor($tenant, string $feature): string
    {
        return match ($feature) {
            'ai_scans' => 'Tu plan actual no permite procesar mas fotos con IA en este momento.',
            'sponsor_detection' => 'Tu plan actual no incluye deteccion ni seleccion de patrocinadores.',
            default => 'Tu plan actual alcanzo el limite disponible para esta funcion.',
        };
    }
}
