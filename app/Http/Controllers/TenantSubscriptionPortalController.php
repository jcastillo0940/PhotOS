<?php

namespace App\Http\Controllers;

use App\Models\SaasPlan;
use App\Models\TenantSubscription;
use App\Models\TenantSubscriptionTransaction;
use App\Services\Billing\TenantBillingService;
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
    ) {
    }

    public function show()
    {
        $tenant = $this->tenantContext->tenant();
        abort_unless($tenant, 404);

        $subscription = $this->billing->currentSubscription($tenant);
        $billingState = $this->billing->billingStateFor($tenant);
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
                'current_period_ends_at' => optional($subscription->current_period_ends_at)?->toIso8601String(),
                'expires_at' => optional($subscription->expires_at)?->toIso8601String(),
            ] : null,
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
            'plans' => SaasPlan::query()
                ->where('is_active', true)
                ->orderBy('id')
                ->get()
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
        ]);
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
