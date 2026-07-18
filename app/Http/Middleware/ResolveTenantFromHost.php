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
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenantFromHost
{
    public function handle(Request $request, Closure $next): Response
    {
        // API requests resolve their tenant from the Bearer token, not the host.
        if (str_starts_with(ltrim($request->getPathInfo(), '/'), 'api/')) {
            return $next($request);
        }

        $context = app(TenantContext::class);

        // Detect surface first — must happen before StartSession so the correct
        // session cookie name is set before Laravel loads the session.
        [$surface, $guard] = $this->detectSurface($request);
        $context->setGuard($guard, $surface);
        config(['session.cookie' => Str::slug(config('app.name')) . '-' . $guard]);

        if (! Schema::hasTable('tenants') || ! Schema::hasTable('tenant_domains')) {
            return $next($request);
        }

        $host = strtolower((string) $request->getHost());

        // SaaS panel has no tenant context — served from its own isolated domain.
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

    /**
     * Determine the surface and guard for this request.
     * Must run before the session starts so config('session.cookie') can be set.
     *
     * Priority:
     *  1. Known SaaS/client dedicated domains
     *  2. URL path prefix (/admin → studio, /client → client)
     *  3. /login and /logout: read hint from query param ?s= or POST field _surface
     *  4. Default: web (public/marketing surface)
     *
     * @return array{0: string, 1: string}  [surface, guard]
     */
    private function detectSurface(Request $request): array
    {
        $host = strtolower((string) $request->getHost());

        // Dedicated SaaS panel domain
        $panelDomain = strtolower((string) config('saas.panel_domain', ''));
        if ($panelDomain && $host === $panelDomain) {
            return ['saas', 'saas'];
        }

        // Dedicated client portal domain (optional — falls back to path-based detection)
        $clientDomain = strtolower((string) config('saas.client_portal_domain', ''));
        if ($clientDomain && $host === $clientDomain) {
            return ['client', 'client'];
        }

        $path = ltrim($request->getPathInfo(), '/');

        // Studio backoffice: /admin/*
        if (str_starts_with($path, 'admin')) {
            return ['studio', 'studio'];
        }

        // Client portal: /client/*
        if (str_starts_with($path, 'client')) {
            return ['client', 'client'];
        }

        // Login page — surface determined by hint so the correct session is loaded
        // GET /login?s=studio|client|saas  →  from auth middleware redirect
        // POST /login with _surface field  →  from login form submission
        if ($path === 'login') {
            $hint = $request->isMethod('POST')
                ? (string) $request->input('_surface', 'studio')
                : (string) $request->query('s', 'studio');

            return in_array($hint, ['studio', 'client', 'saas'], true)
                ? [$hint, $hint]
                : ['studio', 'studio'];
        }

        // Logout — surface provided by the layout that rendered the logout button
        if ($path === 'logout') {
            $hint = (string) $request->input('_surface', 'studio');
            return in_array($hint, ['studio', 'client', 'saas'], true)
                ? [$hint, $hint]
                : ['studio', 'studio'];
        }

        return ['web', 'web'];
    }
}
