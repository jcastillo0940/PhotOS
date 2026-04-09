<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Services\Saas\CloudflareCustomHostnameService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SaasTenantController extends Controller
{
    public function __construct(
        private readonly CloudflareCustomHostnameService $cloudflare,
    ) {
    }

    public function index()
    {
        return Inertia::render('Admin/Saas/Index', [
            'tenants' => Tenant::query()
                ->with(['domains' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('hostname')])
                ->orderBy('name')
                ->get()
                ->map(fn (Tenant $tenant) => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'status' => $tenant->status,
                    'plan_code' => $tenant->plan_code,
                    'billing_email' => $tenant->billing_email,
                    'storage_limit_bytes' => $tenant->storage_limit_bytes,
                    'domains' => $tenant->domains->map(fn (TenantDomain $domain) => [
                        'id' => $domain->id,
                        'hostname' => $domain->hostname,
                        'type' => $domain->type,
                        'is_primary' => $domain->is_primary,
                        'cf_status' => $domain->cf_status,
                    ])->values(),
                ])
                ->values(),
            'cloudflare' => $this->cloudflarePayload(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|alpha_dash|unique:tenants,slug',
            'primary_hostname' => 'required|string|max:255|unique:tenant_domains,hostname',
            'billing_email' => 'nullable|email|max:255',
            'plan_code' => 'required|string|max:50',
        ]);

        $tenant = Tenant::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?: Str::slug($validated['name']),
            'status' => 'active',
            'plan_code' => $validated['plan_code'],
            'billing_email' => $validated['billing_email'] ?? null,
            'storage_limit_bytes' => 0,
            'ai_enabled' => true,
            'custom_domain_enabled' => true,
            'metadata' => [
                'created_via' => 'saas-panel',
            ],
        ]);

        TenantDomain::create([
            'tenant_id' => $tenant->id,
            'hostname' => strtolower($validated['primary_hostname']),
            'type' => 'primary',
            'is_primary' => true,
            'cf_status' => 'internal',
            'verified_at' => now(),
        ]);

        return redirect()->route('admin.saas.tenants.show', $tenant)->with('success', 'Tenant creado.');
    }

    public function show(Tenant $tenant)
    {
        $tenant->load(['domains' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('hostname')]);

        return Inertia::render('Admin/Saas/Show', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'status' => $tenant->status,
                'plan_code' => $tenant->plan_code,
                'billing_email' => $tenant->billing_email,
                'storage_limit_bytes' => $tenant->storage_limit_bytes,
                'domains' => $tenant->domains->map(function (TenantDomain $domain) {
                    return [
                        'id' => $domain->id,
                        'hostname' => $domain->hostname,
                        'type' => $domain->type,
                        'is_primary' => $domain->is_primary,
                        'cf_status' => $domain->cf_status,
                        'cf_custom_hostname_id' => $domain->cf_custom_hostname_id,
                        'verification_method' => $domain->verification_method,
                        'verified_at' => optional($domain->verified_at)?->toIso8601String(),
                        'instructions' => $this->cloudflare->dnsInstructions($domain),
                        'metadata' => $domain->metadata,
                    ];
                })->values(),
            ],
            'cloudflare' => $this->cloudflarePayload(),
        ]);
    }

    public function storeDomain(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'hostname' => 'required|string|max:255|unique:tenant_domains,hostname',
            'type' => 'required|string|in:custom,subdomain',
        ]);

        $domain = TenantDomain::create([
            'tenant_id' => $tenant->id,
            'hostname' => strtolower($validated['hostname']),
            'type' => $validated['type'],
            'is_primary' => false,
            'cf_status' => $validated['type'] === 'subdomain' ? 'internal' : 'pending',
            'metadata' => [
                'created_via' => 'saas-panel',
            ],
        ]);

        if ($validated['type'] === 'custom' && $this->cloudflare->enabled()) {
            try {
                $this->cloudflare->createCustomHostname($domain);

                return redirect()->back()->with('success', 'Dominio agregado y enviado a Cloudflare para validacion.');
            } catch (\Throwable $e) {
                return redirect()->back()->with('error', 'Dominio guardado, pero Cloudflare no pudo procesarlo: '.$e->getMessage());
            }
        }

        return redirect()->back()->with('success', $validated['type'] === 'custom'
            ? 'Dominio agregado. Falta configurar Cloudflare for SaaS o validar DNS.'
            : 'Subdominio agregado.');
    }

    public function syncDomain(Tenant $tenant, TenantDomain $domain)
    {
        abort_unless($domain->tenant_id === $tenant->id, 404);

        try {
            $this->cloudflare->refreshStatus($domain);

            return redirect()->back()->with('success', 'Estado del dominio sincronizado con Cloudflare.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'No se pudo sincronizar el dominio: '.$e->getMessage());
        }
    }

    private function cloudflarePayload(): array
    {
        return [
            'enabled' => $this->cloudflare->enabled(),
            'managed_cname_target' => $this->cloudflare->managedCnameTarget(),
        ];
    }
}
