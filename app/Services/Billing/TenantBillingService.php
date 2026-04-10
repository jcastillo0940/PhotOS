<?php

namespace App\Services\Billing;

use App\Models\SaasRegistration;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\TenantSubscriptionTransaction;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TenantBillingService
{
    public function __construct(
        private readonly PayPalApiService $paypal,
    ) {
    }

    public function currentSubscription(Tenant $tenant): ?TenantSubscription
    {
        return $tenant->subscriptions()->latest('id')->first();
    }

    public function ensureFromRegistration(SaasRegistration $registration): TenantSubscription
    {
        $tenant = $registration->tenant;

        if (!$tenant) {
            throw new RuntimeException('La alta SaaS no tiene tenant asociado.');
        }

        $selectedPrice = data_get($registration->metadata, 'selected_price');

        return TenantSubscription::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'plan_code' => $registration->plan_code,
                'billing_cycle' => $registration->billing_cycle,
            ],
            [
                'provider' => $registration->payment_gateway === 'paypal' ? 'paypal' : 'manual',
                'payment_mode' => $registration->payment_gateway === 'manual' ? 'offline' : 'automatic',
                'status' => $registration->payment_gateway === 'manual' ? 'pending_manual' : 'pending',
                'amount' => $selectedPrice,
                'currency' => data_get($registration->metadata, 'selected_currency', 'USD'),
                'metadata' => [
                    'source_registration_id' => $registration->id,
                    'requested_domain' => $registration->requested_domain,
                    'gateway' => $registration->payment_gateway,
                ],
            ]
        );
    }

    public function billingStateFor(?Tenant $tenant): array
    {
        if (!$tenant) {
            return [
                'status' => 'unknown',
                'allow_front' => true,
                'allow_backoffice' => true,
                'allow_write' => true,
                'is_read_only' => false,
                'banner' => null,
                'grace_ends_at' => null,
            ];
        }

        $subscription = $this->currentSubscription($tenant);

        if (!$subscription) {
            return [
                'status' => 'unconfigured',
                'allow_front' => true,
                'allow_backoffice' => true,
                'allow_write' => true,
                'is_read_only' => false,
                'banner' => null,
                'grace_ends_at' => null,
            ];
        }

        $now = now();
        $status = $subscription->manual_override_status ?: $subscription->status;
        $graceEndsAt = $subscription->grace_ends_at;
        $frontAllowed = true;
        $writeAllowed = true;
        $banner = null;

        if (in_array($status, ['past_due', 'suspended', 'canceled'], true)) {
            $writeAllowed = false;
            $banner = 'Tu cuenta esta en modo restringido. Puedes revisar el panel, pero no subir ni modificar contenido hasta normalizar el pago.';

            if ($graceEndsAt instanceof Carbon && $now->greaterThan($graceEndsAt)) {
                $frontAllowed = false;
            }
        }

        if (in_array($status, ['force_suspended', 'blocked'], true)) {
            $frontAllowed = false;
            $writeAllowed = false;
            $banner = 'La cuenta esta bloqueada temporalmente. Contacta al administrador del SaaS para reactivarla.';
        }

        return [
            'status' => $status,
            'allow_front' => $frontAllowed,
            'allow_backoffice' => true,
            'allow_write' => $writeAllowed,
            'is_read_only' => !$writeAllowed,
            'banner' => $banner,
            'grace_ends_at' => optional($graceEndsAt)?->toIso8601String(),
            'subscription' => [
                'id' => $subscription->id,
                'provider' => $subscription->provider,
                'payment_mode' => $subscription->payment_mode,
                'plan_code' => $subscription->plan_code,
                'billing_cycle' => $subscription->billing_cycle,
                'amount' => $subscription->amount,
                'currency' => $subscription->currency,
                'current_period_ends_at' => optional($subscription->current_period_ends_at)?->toIso8601String(),
                'grace_ends_at' => optional($subscription->grace_ends_at)?->toIso8601String(),
                'paypal_subscription_id' => $subscription->paypal_subscription_id,
                'manual_override_status' => $subscription->manual_override_status,
                'manual_override_reason' => $subscription->manual_override_reason,
            ],
        ];
    }

    public function startPayPalSubscriptionFromRegistration(SaasRegistration $registration): array
    {
        $subscription = $this->ensureFromRegistration($registration);

        if (!$this->paypal->enabled()) {
            throw new RuntimeException('PayPal no esta configurado en esta instalacion.');
        }

        $plan = $this->planDefinition($registration->plan_code, $registration->billing_cycle);
        $productId = $subscription->paypal_product_id;
        if (!$productId) {
            $product = $this->createProductForPlan($plan);
            $productId = $product['id'] ?? null;
        }

        $paypalPlanId = $subscription->paypal_plan_id;
        if (!$paypalPlanId) {
            $createdPlan = $this->createPlanForDefinition($plan, $productId);
            $paypalPlanId = $createdPlan['id'] ?? null;
        }

        $firstName = Arr::first(explode(' ', $registration->owner_name)) ?: $registration->owner_name;
        $lastName = trim(str_replace($firstName, '', $registration->owner_name)) ?: 'Owner';

        $payload = $this->paypal->createSubscription([
            'plan_id' => $paypalPlanId,
            'custom_id' => 'tenant:'.$registration->tenant_id,
            'subscriber' => [
                'name' => [
                    'given_name' => $firstName,
                    'surname' => $lastName,
                ],
                'email_address' => $registration->owner_email,
            ],
            'application_context' => [
                'brand_name' => 'PhotOS',
                'locale' => 'es-PA',
                'user_action' => 'SUBSCRIBE_NOW',
                'return_url' => route('public.saas.signup.success', $registration),
                'cancel_url' => route('public.saas.signup.success', $registration),
            ],
        ]);

        $approvalUrl = collect($payload['links'] ?? [])->firstWhere('rel', 'approve')['href'] ?? null;

        $subscription->update([
            'provider' => 'paypal',
            'payment_mode' => 'automatic',
            'status' => 'pending',
            'paypal_product_id' => $productId,
            'paypal_plan_id' => $paypalPlanId,
            'paypal_subscription_id' => $payload['id'] ?? $subscription->paypal_subscription_id,
            'paypal_approval_url' => $approvalUrl,
            'metadata' => array_merge($subscription->metadata ?? [], [
                'paypal_create_response' => $payload,
            ]),
        ]);

        $registration->update([
            'status' => 'awaiting_paypal_approval',
            'payment_gateway' => 'paypal',
        ]);

        return [
            'subscription' => $subscription->fresh(),
            'approval_url' => $approvalUrl,
            'payload' => $payload,
        ];
    }

    public function applyWebhook(array $event): void
    {
        $subscriptionId = data_get($event, 'resource.id')
            ?: data_get($event, 'resource.billing_agreement_id')
            ?: data_get($event, 'resource.supplementary_data.related_ids.subscription_id');

        if (!$subscriptionId) {
            return;
        }

        $subscription = TenantSubscription::query()
            ->where('paypal_subscription_id', $subscriptionId)
            ->latest('id')
            ->first();

        if (!$subscription) {
            return;
        }

        $eventType = (string) data_get($event, 'event_type');
        $resource = data_get($event, 'resource', []);
        $occurredAt = data_get($event, 'create_time') ? Carbon::parse(data_get($event, 'create_time')) : now();

        DB::transaction(function () use ($subscription, $eventType, $resource, $occurredAt, $event) {
            if (in_array($eventType, ['BILLING.SUBSCRIPTION.ACTIVATED', 'PAYMENT.SALE.COMPLETED', 'PAYMENT.CAPTURE.COMPLETED'], true)) {
                $subscription->update([
                    'status' => 'active',
                    'starts_at' => $subscription->starts_at ?: $occurredAt,
                    'current_period_starts_at' => $subscription->current_period_starts_at ?: $occurredAt,
                    'current_period_ends_at' => $this->nextPeriodEnd($subscription, $occurredAt),
                    'grace_ends_at' => null,
                    'suspended_at' => null,
                    'failed_payments_count' => 0,
                    'manual_override_status' => null,
                    'manual_override_reason' => null,
                ]);

                // Sync tenant status
                $subscription->tenant?->update(['status' => 'active', 'grace_period_ends_at' => null]);
            }

            if (in_array($eventType, ['BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.CANCELLED', 'PAYMENT.SALE.DENIED', 'BILLING.SUBSCRIPTION.PAYMENT.FAILED'], true)) {
                $graceDays = 3; // Business rule: 3 days grace
                $status = $eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ? 'canceled' : 'past_due';
                
                $subscription->update([
                    'status' => $status,
                    'failed_payments_count' => $subscription->failed_payments_count + 1,
                    'grace_ends_at' => $subscription->grace_ends_at ?: now()->addDays($graceDays),
                    'suspended_at' => in_array($eventType, ['BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.CANCELLED'], true) ? now() : $subscription->suspended_at,
                ]);

                // Sync tenant
                $subscription->tenant?->update([
                    'status' => $status,
                    'grace_period_ends_at' => $subscription->grace_ends_at ?: now()->addDays($graceDays)
                ]);
            }

            TenantSubscriptionTransaction::create([
                'tenant_id' => $subscription->tenant_id,
                'tenant_subscription_id' => $subscription->id,
                'provider' => 'paypal',
                'type' => $eventType,
                'status' => data_get($resource, 'status', 'received'),
                'amount' => data_get($resource, 'amount.value') ?: data_get($resource, 'billing_info.last_payment.amount.value'),
                'currency' => data_get($resource, 'amount.currency_code') ?: data_get($resource, 'billing_info.last_payment.amount.currency_code') ?: $subscription->currency,
                'reference' => data_get($event, 'id') ?: $subscription->paypal_subscription_id,
                'occurred_at' => $occurredAt,
                'payload' => $event,
            ]);
        });
    }

    public function manualOverride(Tenant $tenant, array $payload): TenantSubscription
    {
        $subscription = $this->currentSubscription($tenant)
            ?: TenantSubscription::create([
                'tenant_id' => $tenant->id,
                'provider' => 'manual',
                'payment_mode' => 'offline',
                'plan_code' => $tenant->plan_code ?: 'studio',
                'billing_cycle' => 'monthly',
                'status' => 'pending_manual',
                'currency' => 'USD',
            ]);

        $action = $payload['action'];
        $note = $payload['note'] ?? null;
        $paidUntil = !empty($payload['paid_until']) ? Carbon::parse($payload['paid_until']) : null;

        if ($action === 'activate_manual') {
            $subscription->update([
                'provider' => 'manual',
                'payment_mode' => 'offline',
                'status' => 'active',
                'current_period_starts_at' => now(),
                'current_period_ends_at' => $paidUntil ?: now()->addMonth(),
                'grace_ends_at' => null,
                'suspended_at' => null,
                'manual_override_status' => 'active',
                'manual_override_reason' => $note,
            ]);
        }

        if ($action === 'mark_past_due') {
            $subscription->update([
                'status' => 'past_due',
                'grace_ends_at' => now()->addDays(60),
                'manual_override_status' => 'past_due',
                'manual_override_reason' => $note,
            ]);
        }

        if ($action === 'suspend_manual') {
            $subscription->update([
                'status' => 'suspended',
                'suspended_at' => now(),
                'manual_override_status' => 'force_suspended',
                'manual_override_reason' => $note,
                'grace_ends_at' => $subscription->grace_ends_at ?: now()->addDays(60),
            ]);
        }

        if ($action === 'resume_auto') {
            $subscription->update([
                'manual_override_status' => null,
                'manual_override_reason' => null,
                'status' => $subscription->paypal_subscription_id ? 'active' : 'pending',
                'suspended_at' => null,
            ]);
        }

        TenantSubscriptionTransaction::create([
            'tenant_id' => $tenant->id,
            'tenant_subscription_id' => $subscription->id,
            'provider' => $subscription->provider,
            'type' => $action,
            'status' => $subscription->status,
            'amount' => $subscription->amount,
            'currency' => $subscription->currency,
            'reference' => 'manual-override-'.$subscription->id.'-'.now()->timestamp,
            'occurred_at' => now(),
            'payload' => $payload,
        ]);

        return $subscription->fresh();
    }

    public function createVaultSetupToken(Tenant $tenant): array
    {
        if (!$this->paypal->enabled()) {
            throw new RuntimeException('PayPal no esta configurado.');
        }

        return $this->paypal->createSetupToken([
            'customer' => [
                'merchant_customer_id' => 'tenant-'.$tenant->id,
            ],
            'payment_source' => [
                'card' => [
                    'attributes' => [
                        'verification' => [
                            'method' => 'SCA_WHEN_REQUIRED',
                        ],
                    ],
                ],
            ],
        ]);
    }

    public function planDefinition(string $planCode, string $billingCycle): array
    {
        $plan = \App\Models\SaasPlan::where('code', $planCode)->first();
        if (!$plan) {
            throw new \RuntimeException("El plan {$planCode} no existe en la base de datos.");
        }

        $features = $plan->features ?? [];
        $promoKey = $billingCycle === 'annual' ? 'price_yearly_promo' : 'price_monthly_promo';
        $regularKey = $billingCycle === 'annual' ? 'price_yearly' : 'price_monthly';

        return [
            'code' => $planCode,
            'name' => $plan->name,
            'billing_cycle' => $billingCycle,
            'amount' => (float) ($features[$regularKey] ?? 0),
            'promo_amount' => isset($features[$promoKey]) ? (float) $features[$promoKey] : null,
            'currency' => 'USD',
        ];
    }

    private function createProductForPlan(array $plan): array
    {
        return $this->paypal->createProduct([
            'name' => 'PhotOS '.$plan['name'],
            'type' => 'SERVICE',
            'category' => 'SOFTWARE',
            'description' => 'Suscripcion '.$plan['name'].' del SaaS PhotOS',
        ]);
    }

    private function createPlanForDefinition(array $plan, ?string $productId): array
    {
        $cycles = [];
        $currency = $plan['currency'] ?? 'USD';

        // Add Promo/Trial Cycle if exists
        if (!empty($plan['promo_amount'])) {
            $cycles[] = [
                'frequency' => [
                    'interval_unit' => $plan['billing_cycle'] === 'annual' ? 'YEAR' : 'MONTH',
                    'interval_count' => 1,
                ],
                'tenure_type' => 'TRIAL',
                'sequence' => 1,
                'total_cycles' => 1, // Only the first cycle is promo
                'pricing_scheme' => [
                    'fixed_price' => [
                        'value' => number_format((float) $plan['promo_amount'], 2, '.', ''),
                        'currency_code' => $currency,
                    ],
                ],
            ];
        }

        // Regular Cycle
        $cycles[] = [
            'frequency' => [
                'interval_unit' => $plan['billing_cycle'] === 'annual' ? 'YEAR' : 'MONTH',
                'interval_count' => 1,
            ],
            'tenure_type' => 'REGULAR',
            'sequence' => empty($cycles) ? 1 : 2,
            'total_cycles' => 0, // Infinite until cancel
            'pricing_scheme' => [
                'fixed_price' => [
                    'value' => number_format((float) $plan['amount'], 2, '.', ''),
                    'currency_code' => $currency,
                ],
            ],
        ];

        return $this->paypal->createPlan([
            'product_id' => $productId,
            'name' => 'PhotOS '.$plan['name'].' '.($plan['billing_cycle'] === 'annual' ? 'Anual' : 'Mensual'),
            'description' => 'Suscripcion para plan '.$plan['name'],
            'status' => 'ACTIVE',
            'billing_cycles' => $cycles,
            'payment_preferences' => [
                'auto_bill_outstanding' => true,
                'setup_fee_failure_action' => 'CONTINUE',
                'payment_failure_threshold' => 2,
            ],
        ]);
    }

    private function nextPeriodEnd(TenantSubscription $subscription, Carbon $startsAt): Carbon
    {
        return $subscription->billing_cycle === 'annual'
            ? $startsAt->copy()->addYear()
            : $startsAt->copy()->addMonth();
    }
}