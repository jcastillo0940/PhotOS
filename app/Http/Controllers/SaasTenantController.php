<?php

namespace App\Http\Controllers;

use App\Models\SaasRegistration;
use App\Models\SaasPlan;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\User;
use App\Services\Billing\TenantBillingService;
use App\Services\Saas\CloudflareCustomHostnameService;
use App\Support\TenantBrandPreset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SaasTenantController extends Controller
{
    public function __construct(
        private readonly CloudflareCustomHostnameService $cloudflare,
        private readonly TenantBillingService $billing,
    ) {
    }

    public function index()
    {
        $registrations = SaasRegistration::withoutGlobalScopes()
            ->with('tenant.primaryDomain')
            ->latest()
            ->limit(12)
            ->get()
            ->map(function (SaasRegistration $registration) {
                return [
                    'id' => $registration->id,
                    'studio_name' => $registration->studio_name,
                    'owner_email' => $registration->owner_email,
                    'plan_code' => $registration->plan_code,
                    'billing_cycle' => $registration->billing_cycle,
                    'payment_gateway' => $registration->payment_gateway,
                    'status' => $registration->status,
                    'requested_domain' => $registration->requested_domain,
                    'provisioned_hostname' => $registration->provisioned_hostname,
                    'selected_price' => data_get($registration->metadata, 'selected_price'),
                    'selected_plan_name' => data_get($registration->metadata, 'selected_plan_name'),
                    'tenant_login_url' => $registration->tenant?->primaryDomain?->hostname
                        ? 'https://'.$registration->tenant->primaryDomain->hostname.'/login'
                        : null,
                    'created_at' => optional($registration->created_at)?->toIso8601String(),
                ];
            })
            ->values();

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
                    'billing' => $this->billing->billingStateFor($tenant),
                    'domains' => $tenant->domains->map(fn (TenantDomain $domain) => [
                        'id' => $domain->id,
                        'hostname' => $domain->hostname,
                        'type' => $domain->type,
                        'is_primary' => $domain->is_primary,
                        'cf_status' => $domain->cf_status,
                    ])->values(),
                ])
                ->values(),
            'registrations' => $registrations,
            'users' => User::withoutGlobalScope('tenant')
                ->orderBy('name')
                ->get(['id', 'tenant_id', 'name', 'email', 'role'])
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'tenant_id' => $user->tenant_id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ])
                ->values(),
            'plans' => SaasPlan::query()
                ->orderBy('id')
                ->get()
                ->map(fn (SaasPlan $plan) => [
                    'id' => $plan->id,
                    'code' => $plan->code,
                    'name' => $plan->name,
                    'is_active' => $plan->is_active,
                    'features' => $plan->features,
                ])
                ->values(),
            'cloudflare' => $this->cloudflarePayload(),
            'presets' => TenantBrandPreset::options(),
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
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|email|max:255|unique:users,email',
            'owner_password' => 'required|string|min:8|max:255',
            'preset_key' => 'nullable|string|max:100',
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
            'metadata' => ['created_via' => 'saas-panel'],
        ]);

        TenantDomain::create([
            'tenant_id' => $tenant->id,
            'hostname' => strtolower($validated['primary_hostname']),
            'type' => 'primary',
            'is_primary' => true,
            'cf_status' => 'internal',
            'verified_at' => now(),
        ]);

        User::create([
            'tenant_id' => $tenant->id,
            'name' => $validated['owner_name'],
            'email' => Str::lower(trim((string) $validated['owner_email'])),
            'password' => Hash::make($validated['owner_password']),
            'role' => 'photographer',
            'email_verified_at' => now(),
        ]);

        TenantBrandPreset::apply($tenant, $validated['preset_key'] ?? null);

        return redirect()->route('admin.saas.tenants.show', $tenant)->with('success', 'Tenant creado con su acceso inicial y preset white-label.');
    }

    public function show(Tenant $tenant)
    {
        $tenant->load([
            'domains' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('hostname'),
        ]);

        $users = $tenant->tenantUsers()
            ->orderBy('name')
            ->get();

        $subscription = $tenant->subscriptions()->latest('id')->with('transactions')->first();
        $billing = $this->billing->billingStateFor($tenant);

        return Inertia::render('Admin/Saas/Show', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'status' => $tenant->status,
                'plan_code' => $tenant->plan_code,
                'billing_email' => $tenant->billing_email,
                'storage_limit_bytes' => $tenant->storage_limit_bytes,
                'website_edit_url' => route('admin.saas.tenants.website.edit', $tenant),
                'login_url' => 'https://'.($tenant->domains->firstWhere('is_primary', true)?->hostname ?? $tenant->domains->first()?->hostname).'/login',
                'billing' => $billing,
                'subscription' => $subscription ? [
                    'id' => $subscription->id,
                    'provider' => $subscription->provider,
                    'payment_mode' => $subscription->payment_mode,
                    'status' => $subscription->status,
                    'plan_code' => $subscription->plan_code,
                    'billing_cycle' => $subscription->billing_cycle,
                    'amount' => $subscription->amount,
                    'currency' => $subscription->currency,
                    'paypal_subscription_id' => $subscription->paypal_subscription_id,
                    'paypal_plan_id' => $subscription->paypal_plan_id,
                    'current_period_ends_at' => optional($subscription->current_period_ends_at)?->toIso8601String(),
                    'grace_ends_at' => optional($subscription->grace_ends_at)?->toIso8601String(),
                    'manual_override_status' => $subscription->manual_override_status,
                    'manual_override_reason' => $subscription->manual_override_reason,
                    'transactions' => $subscription->transactions->sortByDesc('id')->take(12)->values()->map(fn ($transaction) => [
                        'id' => $transaction->id,
                        'provider' => $transaction->provider,
                        'type' => $transaction->type,
                        'status' => $transaction->status,
                        'amount' => $transaction->amount,
                        'currency' => $transaction->currency,
                        'reference' => $transaction->reference,
                        'occurred_at' => optional($transaction->occurred_at)?->toIso8601String(),
                    ]),
                ] : null,
                'users' => $users->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ])->values(),
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
            'planOptions' => SaasPlan::query()
                ->where('is_active', true)
                ->orderBy('id')
                ->get(['code', 'name'])
                ->map(fn (SaasPlan $plan) => [
                    'code' => $plan->code,
                    'name' => $plan->name,
                ])
                ->values(),
            'cloudflare' => $this->cloudflarePayload(),
        ]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'required|string|in:active,past_due,suspended,blocked',
            'plan_code' => 'required|string|exists:saas_plans,code',
            'billing_email' => 'nullable|email|max:255',
        ]);

        $tenant->update($validated);

        return redirect()->back()->with('success', 'Tenant actualizado.');
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
            'metadata' => ['created_via' => 'saas-panel'],
        ]);

        if ($validated['type'] === 'custom' && $this->cloudflare->enabled()) {
            try {
                $this->cloudflare->createCustomHostname($domain);
                return redirect()->back()->with('success', 'Dominio agregado y enviado a Cloudflare para validacion.');
            } catch (\Throwable $e) {
                return redirect()->back()->with('error', 'Dominio guardado, pero Cloudflare no pudo procesarlo: '.$e->getMessage());
            }
        }

        return redirect()->back()->with('success', $validated['type'] === 'custom' ? 'Dominio agregado. Falta configurar Cloudflare for SaaS o validar DNS.' : 'Subdominio agregado.');
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
