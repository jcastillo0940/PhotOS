<?php

namespace App\Http\Controllers;

use App\Models\SaasRegistration;
use App\Models\Tenant;
use App\Services\Billing\PayPalApiService;
use App\Services\Billing\TenantBillingService;
use Illuminate\Http\Request;

class SaasBillingController extends Controller
{
    public function __construct(
        private readonly TenantBillingService $billing,
        private readonly PayPalApiService $paypal,
    ) {
    }

    public function createPayPalSubscription(SaasRegistration $registration)
    {
        try {
            $result = $this->billing->startPayPalSubscriptionFromRegistration($registration);
            $approvalUrl = $result['approval_url'] ?? null;

            if (!$approvalUrl) {
                return redirect()->back()->with('error', 'PayPal no devolvio una URL de aprobacion para la suscripcion.');
            }

            return \Inertia\Inertia::location($approvalUrl);
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
}