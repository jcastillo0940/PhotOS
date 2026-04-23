<?php

namespace App\Http\Controllers;

use App\Models\DomainOrder;
use App\Models\SaasPlan;
use App\Models\TenantDomain;
use App\Models\TenantSubscription;
use App\Models\TenantSubscriptionTransaction;
use App\Services\Billing\TenantBillingService;
use App\Services\Saas\CloudflareCustomHostnameService;
use App\Services\Saas\CloudflareRegistrarService;
use App\Services\Saas\DomainProvisioningService;
use App\Support\SaasPlanCatalog;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TenantSubscriptionPortalController extends Controller
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly TenantBillingService $billing,
        private readonly CloudflareCustomHostnameService $cloudflare,
        private readonly CloudflareRegistrarService $registrar,
        private readonly DomainProvisioningService $provisioning,
    ) {
    }

    public function show()
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);

        $subscription = $this->billing->currentSubscription($tenant);
        $billingState = $this->billing->billingStateFor($tenant);
        $statement = $this->billing->accountStatementFor($tenant);
        $transactions = TenantSubscriptionTransaction::query()
            ->where('tenant_id', $tenant->id)
            ->latest('occurred_at')
            ->latest('id')
            ->limit(12)
            ->get();

        return Inertia::render('Admin/Subscription/Show', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'status' => $tenant->status,
                'plan_code' => $tenant->plan_code,
                'billing_email' => $tenant->billing_email,
                'custom_domain' => $tenant->custom_domain,
            ],
            'billing' => [
                ...$billingState,
                'days_remaining' => filled(data_get($billingState, 'expires_at'))
                    ? max(0, now()->diffInDays(Carbon::parse((string) data_get($billingState, 'expires_at')), false))
                    : null,
            ],
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'provider' => $subscription->provider,
                'payment_mode' => $subscription->payment_mode,
                'plan_code' => $subscription->plan_code,
                'billing_cycle' => $subscription->billing_cycle,
                'status' => $subscription->status,
                'amount' => (float) $subscription->amount,
                'currency' => $subscription->currency,
                'discount_type' => $subscription->discount_type,
                'discount_value' => $subscription->discount_value !== null ? (float) $subscription->discount_value : null,
                'discount_reason' => $subscription->discount_reason,
                'discount_ends_at' => optional($subscription->discount_ends_at)?->toIso8601String(),
                'current_period_ends_at' => optional($subscription->current_period_ends_at)?->toIso8601String(),
                'expires_at' => optional($subscription->expires_at)?->toIso8601String(),
            ] : null,
            'statement' => $statement,
            'transactions' => $transactions->map(fn (TenantSubscriptionTransaction $transaction) => [
                'id' => $transaction->id,
                'provider' => $transaction->provider,
                'type' => $transaction->type,
                'status' => $transaction->status,
                'amount' => (float) $transaction->amount,
                'currency' => $transaction->currency,
                'reference' => $transaction->reference,
                'occurred_at' => optional($transaction->occurred_at)?->toIso8601String(),
                'payload' => [
                    ...($transaction->payload ?? []),
                    'receipt_url' => filled(data_get($transaction->payload, 'receipt_path'))
                        ? Storage::disk('public')->url(data_get($transaction->payload, 'receipt_path'))
                        : null,
                ],
            ])->values(),
            'plans' => SaasPlanCatalog::sortCollection(
                SaasPlan::query()
                    ->where('is_active', true)
                    ->get()
            )
                ->map(function (SaasPlan $plan) {
                    $features = $plan->resolvedFeatures();

                    return [
                        'code' => $plan->code,
                        'name' => $plan->name,
                        'segment' => data_get($features, 'segment'),
                        'price_monthly' => (float) (data_get($features, 'price_monthly') ?? 0),
                        'price_yearly' => (float) (data_get($features, 'price_yearly') ?? 0),
                        'storage_gb' => data_get($features, 'storage_gb'),
                        'photos_per_month' => data_get($features, 'photos_per_month'),
                        'staff_limit' => data_get($features, 'staff_limit'),
                        'custom_domain' => (bool) data_get($features, 'custom_domain', false),
                    ];
                })
                ->values(),
            'domains' => $tenant->domains()
                ->orderByDesc('is_primary')
                ->orderBy('hostname')
                ->get()
                ->map(fn (TenantDomain $domain) => [
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
                ])
                ->values(),
            'cloudflare' => [
                'enabled' => $this->cloudflare->enabled(),
                'managed_cname_target' => $this->cloudflare->managedCnameTarget(),
            ],
            'registrar' => [
                'enabled' => $this->registrar->enabled(),
            ],
            'domainOrders' => DomainOrder::query()
                ->where('tenant_id', $tenant->id)
                ->latest('id')
                ->limit(12)
                ->get()
                ->map(fn (DomainOrder $order) => [
                    'id' => $order->id,
                    'type' => $order->type,
                    'provider' => $order->provider,
                    'domain_name' => $order->domain_name,
                    'status' => $order->status,
                    'currency' => $order->currency,
                    'amount' => $order->amount !== null ? (float) $order->amount : null,
                    'registrar_reference' => $order->registrar_reference,
                    'error_message' => $order->error_message,
                    'notes' => $order->notes,
                    'verification_attempts' => $order->verification_attempts,
                    'last_checked_at' => optional($order->last_checked_at)?->toIso8601String(),
                    'next_check_at' => optional($order->next_check_at)?->toIso8601String(),
                    'manual_state' => $order->manual_state,
                    'completed_at' => optional($order->completed_at)?->toIso8601String(),
                    'metadata' => $order->metadata,
                ])
                ->values(),
            'domainSearchResults' => collect(session('domain_search_results', []))->values(),
            'domainSearchQuery' => (string) session('domain_search_query', ''),
        ]);
    }

    public function storeCustomDomain(Request $request)
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);

        $validated = $request->validate([
            'hostname' => 'required|string|max:255|unique:tenant_domains,hostname',
        ]);

        try {
            $this->provisioning->connectExistingDomain($tenant, (string) $validated['hostname']);

            return redirect()->back()->with('success', 'Dominio externo agregado. Ya puedes copiar los DNS y esperar la activacion.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function syncCustomDomain(TenantDomain $domain)
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);
        abort_unless($domain->tenant_id === $tenant->id, 404);

        try {
            $this->cloudflare->refreshStatus($domain);

            return redirect()->back()->with('success', 'Estado del dominio sincronizado con Cloudflare.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'No se pudo sincronizar el dominio: '.$e->getMessage());
        }
    }

    public function searchPurchasableDomains(Request $request)
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);

        $validated = $request->validate([
            'query' => 'required|string|min:2|max:80',
        ]);

        try {
            $results = $this->registrar->search((string) $validated['query']);

            return redirect()->back()
                ->with('domain_search_query', (string) $validated['query'])
                ->with('domain_search_results', $results)
                ->with('success', 'Busqueda de dominios actualizada.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'No se pudo consultar Cloudflare Registrar: '.$e->getMessage());
        }
    }

    public function purchaseDomain(Request $request)
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);

        $validated = $request->validate([
            'domain_name' => 'required|string|max:255',
        ]);

        try {
            $order = $this->provisioning->purchaseAndProvision($tenant, (string) $validated['domain_name']);

            $message = $order->status === 'active'
                ? 'Dominio comprado y activado en el SaaS.'
                : 'Dominio comprado. El sistema ya inicio la provision y validacion.';

            return redirect()->back()->with('success', $message);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'No se pudo comprar el dominio: '.$e->getMessage());
        }
    }

    public function syncDomainOrder(DomainOrder $domainOrder)
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);
        abort_unless($domainOrder->tenant_id === $tenant->id, 404);

        try {
            $this->provisioning->syncOrderStatus($domainOrder);

            return redirect()->back()->with('success', 'Estado del pedido de dominio sincronizado.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'No se pudo sincronizar el pedido: '.$e->getMessage());
        }
    }

    public function markDomainOrderDnsConfigured(Request $request, DomainOrder $domainOrder)
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);
        abort_unless($domainOrder->tenant_id === $tenant->id, 404);

        $validated = $request->validate([
            'note' => 'nullable|string|max:1500',
        ]);

        try {
            $this->provisioning->markDnsConfigured($domainOrder, $validated['note'] ?? null);

            return redirect()->back()->with('success', 'Marcamos el DNS como configurado y activamos la reverificacion automatica.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function retryDomainOrder(Request $request, DomainOrder $domainOrder)
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);
        abort_unless($domainOrder->tenant_id === $tenant->id, 404);

        $validated = $request->validate([
            'note' => 'nullable|string|max:1500',
        ]);

        try {
            $this->provisioning->retryOrder($domainOrder, $validated['note'] ?? null);

            return redirect()->back()->with('success', 'Pedido marcado para reintento manual.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function cancelDomainOrder(Request $request, DomainOrder $domainOrder)
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);
        abort_unless($domainOrder->tenant_id === $tenant->id, 404);

        $validated = $request->validate([
            'note' => 'nullable|string|max:1500',
        ]);

        try {
            $this->provisioning->cancelOrder($domainOrder, $validated['note'] ?? null);

            return redirect()->back()->with('success', 'Pedido cancelado.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function noteDomainOrder(Request $request, DomainOrder $domainOrder)
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);
        abort_unless($domainOrder->tenant_id === $tenant->id, 404);

        $validated = $request->validate([
            'note' => 'required|string|max:1500',
        ]);

        try {
            $this->provisioning->addNote($domainOrder, (string) $validated['note']);

            return redirect()->back()->with('success', 'Nota guardada en el pedido de dominio.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function submitOfflinePayment(Request $request)
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'required|string|max:120',
            'note' => 'nullable|string|max:1500',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        $subscription = $this->billing->currentSubscription($tenant)
            ?: TenantSubscription::create([
                'tenant_id' => $tenant->id,
                'provider' => 'manual',
                'payment_mode' => 'offline',
                'plan_code' => $tenant->plan_code ?: 'starter',
                'billing_cycle' => 'monthly',
                'status' => 'pending_manual',
                'currency' => 'USD',
            ]);

        $receiptPath = $request->hasFile('receipt')
            ? $request->file('receipt')->store('tenant-billing/receipts', 'public')
            : null;

        TenantSubscriptionTransaction::create([
            'tenant_id' => $tenant->id,
            'tenant_subscription_id' => $subscription->id,
            'provider' => 'manual',
            'type' => 'offline_payment_submitted',
            'status' => 'submitted',
            'amount' => (float) $validated['amount'],
            'currency' => $subscription->currency ?: 'USD',
            'reference' => $validated['reference'],
            'occurred_at' => now(),
            'payload' => [
                'note' => $validated['note'] ?? null,
                'receipt_path' => $receiptPath,
                'source' => 'tenant_portal',
            ],
        ]);

        return redirect()->back()->with('success', 'Comprobante enviado. Ya quedo registrado para revision administrativa.');
    }

    public function requestPlanChange(Request $request)
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);

        $validated = $request->validate([
            'plan_code' => 'required|string|exists:saas_plans,code',
            'billing_cycle' => 'required|string|in:monthly,yearly',
        ]);

        $subscription = $this->billing->currentSubscription($tenant)
            ?: TenantSubscription::create([
                'tenant_id' => $tenant->id,
                'provider' => 'manual',
                'payment_mode' => 'offline',
                'plan_code' => $tenant->plan_code ?: $validated['plan_code'],
                'billing_cycle' => $validated['billing_cycle'],
                'status' => 'pending_manual',
                'currency' => 'USD',
            ]);

        $planDefinition = $this->billing->planDefinition($validated['plan_code'], $validated['billing_cycle']);

        TenantSubscriptionTransaction::create([
            'tenant_id' => $tenant->id,
            'tenant_subscription_id' => $subscription->id,
            'provider' => $subscription->provider ?: 'manual',
            'type' => 'plan_change_request',
            'status' => 'requested',
            'amount' => (float) ($planDefinition['amount'] ?? 0),
            'currency' => $planDefinition['currency'] ?? 'USD',
            'reference' => 'plan-change-'.$tenant->id.'-'.now()->timestamp,
            'occurred_at' => now(),
            'payload' => [
                'requested_plan_code' => $validated['plan_code'],
                'requested_billing_cycle' => $validated['billing_cycle'],
                'current_plan_code' => $subscription->plan_code,
                'current_billing_cycle' => $subscription->billing_cycle,
                'source' => 'tenant_portal',
            ],
        ]);

        return redirect()->back()->with('success', 'Solicitud de cambio de plan enviada. Queda registrada para aplicar el ajuste de cobro correspondiente.');
    }
}
