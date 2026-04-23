<?php

namespace App\Http\Controllers;

use App\Models\Purchase as GalleryPurchase;
use App\Models\SaasRegistration;
use App\Models\Tenant;
use App\Services\Billing\PayPalApiService;
use App\Services\Billing\TenantBillingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SaasBillingController extends Controller
{
    public function __construct(
        private readonly TenantBillingService $billing,
        private readonly PayPalApiService $paypal,
    ) {}

    public function createPayPalSubscription(SaasRegistration $registration)
    {
        try {
            $result = $this->billing->startPayPalSubscriptionFromRegistration($registration);
            $approvalUrl = $result['approval_url'] ?? null;

            if (! $approvalUrl) {
                return redirect()->back()->with('error', 'PayPal no devolvio una URL de aprobacion para la suscripcion.');
            }

            return Inertia::location($approvalUrl);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'No se pudo iniciar la suscripcion en PayPal: '.$e->getMessage());
        }
    }

    public function paypalWebhook(Request $request)
    {
        $event = $request->all();
        $webhookId = config('services.paypal.webhook_id');

        if ($this->paypal->enabled() && $webhookId) {
            $verification = $this->paypal->verifyWebhookSignature([
                'auth_algo' => $request->header('PayPal-Auth-Algo'),
                'cert_url' => $request->header('PayPal-Cert-Url'),
                'transmission_id' => $request->header('PayPal-Transmission-Id'),
                'transmission_sig' => $request->header('PayPal-Transmission-Sig'),
                'transmission_time' => $request->header('PayPal-Transmission-Time'),
                'webhook_id' => $webhookId,
                'webhook_event' => $event,
            ]);

            if (($verification['verification_status'] ?? '') !== 'SUCCESS') {
                return response()->json(['ok' => false, 'message' => 'Webhook signature invalida'], 422);
            }
        }

        $this->billing->applyWebhook($event);
        $this->applyCommerceWebhook($event);

        return response()->json(['ok' => true]);
    }

    public function manualUpdate(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'action' => 'required|string|in:activate_manual,mark_past_due,suspend_manual,resume_auto',
            'note' => 'nullable|string|max:1000',
            'paid_until' => 'nullable|date',
        ]);

        $this->billing->manualOverride($tenant, $validated);

        return redirect()->back()->with('success', 'Estado de facturacion actualizado para este tenant.');
    }

    public function recordManualPayment(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'nullable|string|max:120',
            'occurred_at' => 'nullable|date',
            'paid_until' => 'nullable|date',
            'note' => 'nullable|string|max:1500',
        ]);

        $this->billing->recordManualPayment($tenant, $validated);

        return redirect()->back()->with('success', 'Cobro manual registrado y estado de cuenta actualizado.');
    }

    public function applyDiscount(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'discount_type' => 'nullable|string|in:fixed,percent',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_reason' => 'nullable|string|max:255',
            'discount_ends_at' => 'nullable|date',
        ]);

        if (filled($validated['discount_type'] ?? null) && ! filled($validated['discount_value'] ?? null)) {
            return redirect()->back()->with('error', 'Indica el valor del descuento antes de guardarlo.');
        }

        $this->billing->applyDiscount($tenant, $validated);

        return redirect()->back()->with('success', filled($validated['discount_type'] ?? null) ? 'Descuento aplicado al tenant.' : 'Descuento removido del tenant.');
    }

    public function createSetupToken(Tenant $tenant)
    {
        try {
            $payload = $this->billing->createVaultSetupToken($tenant);

            return redirect()->back()
                ->with('success', 'Setup token creado para tokenizacion de tarjeta.')
                ->with('integration_test', [
                    'service' => 'paypal_setup_token',
                    'ok' => true,
                    'message' => 'Setup token listo: '.($payload['id'] ?? 'sin id'),
                ]);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'No se pudo crear el setup token de PayPal: '.$e->getMessage());
        }
    }

    private function applyCommerceWebhook(array $event): void
    {
        $eventType = (string) data_get($event, 'event_type');

        if (! in_array($eventType, [
            'CHECKOUT.ORDER.APPROVED',
            'PAYMENT.CAPTURE.COMPLETED',
            'PAYMENT.CAPTURE.DENIED',
            'PAYMENT.CAPTURE.DECLINED',
            'PAYMENT.CAPTURE.REFUNDED',
            'PAYMENT.CAPTURE.REVERSED',
        ], true)) {
            return;
        }

        $orderId = data_get($event, 'resource.supplementary_data.related_ids.order_id')
            ?: data_get($event, 'resource.purchase_units.0.payments.captures.0.supplementary_data.related_ids.order_id')
            ?: data_get($event, 'resource.id');
        $captureId = data_get($event, 'resource.id');
        $customId = data_get($event, 'resource.custom_id')
            ?: data_get($event, 'resource.purchase_units.0.custom_id');

        $purchase = $this->findCommercePurchase($eventType, $orderId, $captureId, $customId);

        if (! $purchase) {
            return;
        }

        DB::transaction(function () use ($purchase, $eventType, $event, $orderId, $captureId) {
            $lockedPurchase = GalleryPurchase::query()->lockForUpdate()->find($purchase->id);

            if (! $lockedPurchase) {
                return;
            }

            $lockedPurchase->payload = array_merge($lockedPurchase->payload ?? [], [
                'paypal_last_webhook' => $event,
                'paypal_last_webhook_type' => $eventType,
            ]);

            if ($orderId && ! $lockedPurchase->provider_order_id) {
                $lockedPurchase->provider_order_id = $orderId;
            }

            if ($captureId && blank($lockedPurchase->provider_capture_id) && str_starts_with($eventType, 'PAYMENT.CAPTURE.')) {
                $lockedPurchase->provider_capture_id = $captureId;
            }

            if ($eventType === 'PAYMENT.CAPTURE.COMPLETED') {
                $lockedPurchase->status = 'completed';
                $lockedPurchase->provider_status = (string) data_get($event, 'resource.status', 'COMPLETED');
                $this->applyPurchaseBenefit($lockedPurchase);
            } elseif (in_array($eventType, ['PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.DECLINED'], true)) {
                $lockedPurchase->status = 'failed';
                $lockedPurchase->provider_status = (string) data_get($event, 'resource.status', 'DENIED');
            } elseif (in_array($eventType, ['PAYMENT.CAPTURE.REFUNDED', 'PAYMENT.CAPTURE.REVERSED'], true)) {
                $lockedPurchase->status = 'reversed';
                $lockedPurchase->provider_status = (string) data_get($event, 'resource.status', 'REFUNDED');
            } elseif ($eventType === 'CHECKOUT.ORDER.APPROVED') {
                $lockedPurchase->status = in_array($lockedPurchase->status, ['pending', 'awaiting_approval'], true)
                    ? 'approved'
                    : $lockedPurchase->status;
                $lockedPurchase->provider_status = (string) data_get($event, 'resource.status', 'APPROVED');
            }

            $lockedPurchase->save();
        });
    }

    private function findCommercePurchase(string $eventType, mixed $orderId, mixed $captureId, mixed $customId): ?GalleryPurchase
    {
        $query = GalleryPurchase::query()->where('gateway', 'paypal');

        if (str_starts_with($eventType, 'PAYMENT.CAPTURE.')) {
            $purchase = (clone $query)->where('provider_capture_id', (string) $captureId)->latest('id')->first();
            if ($purchase) {
                return $purchase;
            }
        }

        if ($orderId) {
            $purchase = (clone $query)->where('provider_order_id', (string) $orderId)->latest('id')->first();
            if ($purchase) {
                return $purchase;
            }
        }

        if (is_string($customId) && str_starts_with($customId, 'purchase:')) {
            return $query->whereKey((int) substr($customId, strlen('purchase:')))->first();
        }

        return null;
    }

    private function applyPurchaseBenefit(GalleryPurchase $purchase): void
    {
        if ($purchase->benefit_applied_at) {
            return;
        }

        $project = $purchase->project()->lockForUpdate()->first();

        if (! $project) {
            return;
        }

        if ($purchase->type === 'full_gallery') {
            $project->update(['is_full_gallery_purchased' => true]);
        }

        if ($purchase->type === 'extra_pack') {
            $quota = (int) data_get($purchase->payload, 'extra_download_quota', 5);
            $project->increment('extra_download_quota', max(1, $quota));
        }

        $purchase->benefit_applied_at = now();
    }
}
