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
            $tenant = Tenant::query()
                ->where('status', 'active')
                ->orderBy('id')
                ->first();
        }

        $context->set($tenant, $host);

        if ($tenant) {
            config(['filesystems.disks.r2.root' => "tenants/{$tenant->slug}"]);
            Storage::forgetDisk('r2');
        }

        if (! $tenant && $request->route()?->getName() !== null) {
            abort(404, 'No se encontro una cuenta activa para este dominio.');
        }

        return $next($request);
    }
}
