<?php

namespace App\Http\Controllers;

use App\Models\SaasRegistration;
use App\Models\SaasPlan;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\User;
use App\Services\Billing\PayPalApiService;
use App\Services\Billing\TenantBillingService;
use App\Services\Saas\CloudflareCustomHostnameService;
use App\Support\SaasPlanCatalog;
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
        private readonly CloudflareCustomHostnameService $cloudflare,
    ) {
    }

    public function create(Request $request)
    {
        return Inertia::render('Public/SaasSignup', [
            'plans' => $this->plans(),
            'presets' => TenantBrandPreset::options(),
            'paymentGateways' => $this->paymentGateways(),
            'centralDomain' => $this->marketingCentralDomain(),
            'selectedPlanCode' => (string) $request->query('plan', 'starter'),
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
        $features = $selectedPlan['features'] ?? [];
        $requestedDomain = filled($validated['requested_domain'] ?? null)
            ? Str::lower(trim((string) $validated['requested_domain']))
            : null;

        $tenant = Tenant::create([
            'name' => $validated['studio_name'],
            'slug' => Str::slug($validated['slug']),
            'status' => 'active',
            'plan_code' => $validated['plan_code'],
            'billing_email' => $validated['owner_email'],
            'storage_limit_bytes' => 0,
            'ai_enabled' => (bool) (($features['ai_face_recognition'] ?? false) || ($features['ai_sponsor_detection'] ?? false)),
            'custom_domain_enabled' => (bool) ($features['custom_domain'] ?? false),
            'custom_domain' => (bool) ($features['custom_domain'] ?? false) ? $requestedDomain : null,
            'metadata' => [
                'created_via' => 'public-saas-onboarding',
                'billing_cycle' => $validated['billing_cycle'],
                'payment_status' => 'pending',
                'payment_gateway' => $validated['payment_gateway'] ?? $this->defaultGatewayCode(),
                'selected_plan_name' => $selectedPlan['name'] ?? $validated['plan_code'],
                'selected_price' => $selectedPrice,
                'plan_segment' => $selectedPlan['segment'] ?? null,
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

        if ($requestedDomain && (bool) ($features['custom_domain'] ?? false)) {
            $customDomain = TenantDomain::create([
                'tenant_id' => $tenant->id,
                'hostname' => $requestedDomain,
                'type' => 'custom',
                'is_primary' => false,
                'cf_status' => 'pending',
                'metadata' => ['created_via' => 'public-saas-onboarding'],
            ]);

            if ($this->cloudflare->enabled()) {
                try {
                    $this->cloudflare->createCustomHostname($customDomain);
                } catch (\Throwable $e) {
                    $customDomain->forceFill([
                        'metadata' => array_merge($customDomain->metadata ?? [], [
                            'cloudflare_error' => $e->getMessage(),
                        ]),
                    ])->save();
                }
            }
        }

        User::create([
            'tenant_id' => $tenant->id,
            'name' => $validated['owner_name'],
            'email' => Str::lower(trim((string) $validated['owner_email'])),
            'password' => Hash::make($validated['owner_password']),
            'role' => 'owner',
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
            'requested_domain' => $requestedDomain,
            'provisioned_hostname' => $hostname,
            'tenant_id' => $tenant->id,
            'metadata' => [
                'preset_key' => $validated['preset_key'] ?? TenantBrandPreset::defaultKey(),
                'checkout_mode' => 'manual-ready',
                'selected_plan_name' => $selectedPlan['name'] ?? $validated['plan_code'],
                'selected_price' => $selectedPrice,
                'selected_currency' => 'USD',
                'plan_segment' => $selectedPlan['segment'] ?? null,
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
        return SaasPlanCatalog::sortCollection(
            SaasPlan::query()
                ->where('is_active', true)
                ->get()
        )
            ->map(function (SaasPlan $plan) {
                $definition = $plan->resolvedDefinition();
                $features = $definition['features'] ?? [];
                $items = [];

                if (($features['storage_gb'] ?? null) !== null) {
                    $items[] = ($features['storage_gb']).' GB de almacenamiento original';
                }

                if (($features['photos_per_month'] ?? null) !== null) {
                    $items[] = $features['photos_per_month'] > 0
                        ? number_format((int) $features['photos_per_month']).' fotos por mes'
                        : 'Sin procesamiento IA mensual';
                }

                $items[] = ($features['ai_face_recognition'] ?? false)
                    ? (($features['ai_sponsor_detection'] ?? false)
                        ? 'IA de rostros y patrocinadores'
                        : 'IA de reconocimiento facial')
                    : 'IA desactivada';

                if (($features['custom_domain'] ?? false) === true) {
                    $items[] = 'Soporte para dominio propio';
                }

                if (array_key_exists('sponsor_selection_limit', $features)) {
                    $limit = $features['sponsor_selection_limit'];
                    if ($limit === null) {
                        $items[] = 'Patrocinadores ilimitados por evento';
                    } elseif ((int) $limit > 0) {
                        $items[] = 'Hasta '.(int) $limit.' patrocinadores por evento';
                    }
                }

                return [
                    'code' => $definition['code'],
                    'name' => $definition['name'],
                    'segment' => $definition['segment'] ?? null,
                    'monthly_price' => $definition['price_monthly'] ?? 0,
                    'annual_price' => $definition['price_yearly'] ?? 0,
                    'description' => $this->planDescription($definition['code']),
                    'items' => $items,
                    'features' => $features,
                    'featured' => $definition['code'] === 'starter',
                ];
            })
            ->values()
            ->all();
    }

    private function planDescription(string $code): string
    {
        return match ($code) {
            'basic' => 'Boveda basica para fotografos sociales que no necesitan IA.',
            'launch' => 'Puente de entrada con IA basica y un costo muy bajo para validar demanda real.',
            'starter' => 'Entrada B2C con reconocimiento facial y flujo simple para bodas y sociales.',
            'pro' => 'Operacion B2B para eventos corporativos y deportivos con patrocinadores.',
            'business' => 'Mayor volumen mensual y mas patrocinadores por evento para equipos exigentes.',
            'enterprise' => 'Capacidad alta, patrocinadores ilimitados y lista para cuentas de gran escala.',
            default => 'Plan SaaS PhotOS.',
        };
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
            return ! in_array($domain, ['localhost', '127.0.0.1'], true);
        }));

        return $domains[0] ?? 'photos.pixelprocr.com';
    }
}

