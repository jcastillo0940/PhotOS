<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenantFromHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $context = app(TenantContext::class);

        if (! Schema::hasTable('tenants') || ! Schema::hasTable('tenant_domains')) {
            return $next($request);
        }

        $host = strtolower((string) $request->getHost());

        // El panel SaaS no pertenece a ningún tenant — se sirve sin contexto de tenant.
        $panelDomain = strtolower((string) config('saas.panel_domain', ''));
        if ($panelDomain && $host === $panelDomain) {
            $context->set(null, $host);
            return $next($request);
        }

        $tenant = TenantDomain::query()
            ->with('tenant')
            ->where('hostname', $host)
            ->first()
            ?->tenant;

        if (! $tenant && Schema::hasColumn('tenants', 'custom_domain')) {
            $tenant = Tenant::query()
                ->where('custom_domain', $host)
                ->first();
        }

        $centralDomains = Arr::wrap(config('saas.central_domains', []));

        if (! $tenant && in_array($host, $centralDomains, true)) {
            // El fallback al primer tenant activo solo aplica en entorno local.
            // En producción un dominio central sin registro explícito en tenant_domains
            // no sirve datos de ningún estudio — el tenant queda null.
            if (app()->environment('local')) {
                $tenant = Tenant::query()
                    ->where('status', 'active')
                    ->orderBy('id')
                    ->first();
            }
        }

        $context->set($tenant, $host);

        if ($tenant) {
            if (! $tenant->slug) {
                abort(503, 'La cuenta asociada a este dominio no tiene un identificador de almacenamiento configurado.');
            }
            config(['filesystems.disks.r2.root' => "tenants/{$tenant->slug}"]);
            Storage::forgetDisk('r2');
        }

        if (! $tenant && $request->route()?->getName() !== null) {
            abort(404, 'No se encontro una cuenta activa para este dominio.');
        }

        return $next($request);
    }
}
