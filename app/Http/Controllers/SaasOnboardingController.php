<?php

namespace App\Http\Controllers;

use App\Models\SaasRegistration;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\User;
use App\Services\Billing\PayPalApiService;
use App\Services\Billing\TenantBillingService;
use App\Support\TenantBrandPreset;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SaasOnboardingController extends Controller
{
    public function __construct(
        private readonly TenantBillingService $billing,
        private readonly PayPalApiService $paypal,
    ) {
    }

    public function create(Request $request)
    {
        return Inertia::render('Public/SaasSignup', [
            'plans' => $this->plans(),
            'presets' => TenantBrandPreset::options(),
            'paymentGateways' => $this->paymentGateways(),
            'centralDomain' => $this->marketingCentralDomain(),
            'selectedPlanCode' => (string) $request->query('plan', 'studio'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'studio_name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|alpha_dash|unique:tenants,slug',
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|email|max:255|unique:users,email',
            'owner_phone' => 'nullable|string|max:50',
            'owner_password' => 'required|string|min:8|max:255',
            'plan_code' => ['required', Rule::in(collect($this->plans())->pluck('code')->all())],
            'billing_cycle' => ['required', Rule::in(['monthly', 'annual'])],
            'preset_key' => 'nullable|string|max:100',
            'requested_domain' => 'nullable|string|max:255',
            'payment_gateway' => ['nullable', Rule::in(collect($this->paymentGateways())->pluck('code')->all())],
            'terms' => 'accepted',
        ]);

        $selectedPlan = collect($this->plans())->firstWhere('code', $validated['plan_code']);
        $billingCycle = $validated['billing_cycle'];
        $selectedPrice = $billingCycle === 'annual'
            ? ($selectedPlan['annual_price'] ?? null)
            : ($selectedPlan['monthly_price'] ?? null);

        $tenant = Tenant::create([
            'name' => $validated['studio_name'],
            'slug' => Str::slug($validated['slug']),
            'status' => 'active',
            'plan_code' => $validated['plan_code'],
            'billing_email' => $validated['owner_email'],
            'storage_limit_bytes' => 0,
            'ai_enabled' => true,
            'custom_domain_enabled' => true,
            'metadata' => [
                'created_via' => 'public-saas-onboarding',
                'billing_cycle' => $validated['billing_cycle'],
                'payment_status' => 'pending',
                'payment_gateway' => $validated['payment_gateway'] ?? $this->defaultGatewayCode(),
                'selected_plan_name' => $selectedPlan['name'] ?? $validated['plan_code'],
                'selected_price' => $selectedPrice,
            ],
        ]);

        $hostname = Str::slug($validated['slug']).'.'.$this->marketingCentralDomain();

        TenantDomain::create([
            'tenant_id' => $tenant->id,
            'hostname' => strtolower($hostname),
            'type' => 'subdomain',
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

        $registration = SaasRegistration::create([
            'studio_name' => $validated['studio_name'],
            'slug' => Str::slug($validated['slug']),
            'owner_name' => $validated['owner_name'],
            'owner_email' => Str::lower(trim((string) $validated['owner_email'])),
            'owner_phone' => $validated['owner_phone'] ?? null,
            'plan_code' => $validated['plan_code'],
            'billing_cycle' => $validated['billing_cycle'],
            'payment_gateway' => $validated['payment_gateway'] ?? $this->defaultGatewayCode(),
            'status' => 'pending_payment',
            'requested_domain' => $validated['requested_domain'] ?? null,
            'provisioned_hostname' => $hostname,
            'tenant_id' => $tenant->id,
            'metadata' => [
                'preset_key' => $validated['preset_key'] ?? TenantBrandPreset::defaultKey(),
                'checkout_mode' => 'manual-ready',
                'selected_plan_name' => $selectedPlan['name'] ?? $validated['plan_code'],
                'selected_price' => $selectedPrice,
                'selected_currency' => 'USD',
            ],
        ]);

        $this->billing->ensureFromRegistration($registration);

        return redirect()->route('public.saas.signup.success', $registration);
    }

    public function success(SaasRegistration $registration)
    {
        abort_unless($registration->tenant_id, 404);

        return Inertia::render('Public/SaasSignupSuccess', [
            'registration' => [
                'id' => $registration->id,
                'studio_name' => $registration->studio_name,
                'owner_name' => $registration->owner_name,
                'owner_email' => $registration->owner_email,
                'plan_code' => $registration->plan_code,
                'billing_cycle' => $registration->billing_cycle,
                'payment_gateway' => $registration->payment_gateway,
                'status' => $registration->status,
                'requested_domain' => $registration->requested_domain,
                'provisioned_hostname' => $registration->provisioned_hostname,
                'login_url' => 'https://'.$registration->provisioned_hostname.'/login',
                'metadata' => $registration->metadata ?? [],
            ],
            'plan' => collect($this->plans())->firstWhere('code', $registration->plan_code),
            'paypalEnabled' => $this->paypal->enabled(),
        ]);
    }

    private function plans(): array
    {
        return [
            [
                'code' => 'starter',
                'name' => 'Starter',
                'monthly_price' => 19,
                'annual_price' => 190,
                'description' => 'Para fotografos que quieren branding propio y entrega elegante.',
                'items' => ['Home y portafolio white-label', 'Galerias publicas y privadas', 'Panel basico de proyectos'],
            ],
            [
                'code' => 'studio',
                'name' => 'Studio',
                'monthly_price' => 49,
                'annual_price' => 490,
                'description' => 'Para estudios que necesitan operacion comercial y portal cliente.',
                'items' => ['CRM, agenda y formularios', 'Contratos y facturacion', 'Portal cliente y descargas premium'],
                'featured' => true,
            ],
            [
                'code' => 'scale',
                'name' => 'Scale',
                'monthly_price' => 99,
                'annual_price' => 990,
                'description' => 'Para estudios que quieren white-label fuerte y expansion SaaS.',
                'items' => ['Multiusuario y automatizaciones', 'Onboarding de dominios custom', 'Reconocimiento facial y extras premium'],
            ],
        ];
    }

    private function paymentGateways(): array
    {
        return [
            ['code' => 'tilopay', 'label' => 'Tilopay'],
            ['code' => 'paypal', 'label' => 'PayPal'],
            ['code' => 'manual', 'label' => 'Cobro asistido'],
        ];
    }

    private function defaultGatewayCode(): string
    {
        return $this->paymentGateways()[0]['code'];
    }

    private function marketingCentralDomain(): string
    {
        $domains = array_values(array_filter(Arr::wrap(config('saas.central_domains', [])), function ($domain) {
            return !in_array($domain, ['localhost', '127.0.0.1'], true);
        }));

        return $domains[0] ?? 'photos.pixelprocr.com';
    }
}