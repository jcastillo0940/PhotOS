<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Purchase;
use App\Services\Billing\PayPalApiService;
use Illuminate\Http\Request;
use RuntimeException;

class PaymentController extends Controller
{
    private const EXTRA_PACK_PRICE = 19.99;

    private const EXTRA_PACK_SIZE = 5;

    public function __construct(
        private readonly PayPalApiService $paypal,
    ) {}

    public function purchaseFullGallery(Request $request, string $token)
    {
        return $this->startPayPalCheckout($token, 'full_gallery');
    }

    public function purchaseExtraPack(Request $request, string $token)
    {
        return $this->startPayPalCheckout($token, 'extra_pack');
    }

    public function paypalReturn(Request $request, Purchase $purchase)
    {
        $purchase->load('project');
        abort_unless($purchase->project, 404);

        $orderId = trim((string) $request->query('token', ''));

        if ($orderId === '') {
            return redirect()
                ->route('public.gallery.show', $purchase->project->gallery_token)
                ->with('error', 'PayPal no devolvio una orden valida para esta compra.');
        }

        if ($purchase->provider_order_id !== $orderId) {
            return redirect()
                ->route('public.gallery.show', $purchase->project->gallery_token)
                ->with('error', 'La orden devuelta por PayPal no coincide con la compra esperada.');
        }

        if ($purchase->status === 'completed') {
            return redirect()
                ->route('public.gallery.show', $purchase->project->gallery_token)
                ->with('success', 'El pago ya fue validado anteriormente y el beneficio esta activo.');
        }

        try {
            $capture = $this->paypal->captureOrder($orderId);
        } catch (\Throwable $e) {
            $purchase->update([
                'status' => 'failed',
                'provider_status' => 'CAPTURE_FAILED',
                'payload' => array_merge($purchase->payload ?? [], [
                    'paypal_capture_error' => $e->getMessage(),
                ]),
            ]);

            return redirect()
                ->route('public.gallery.show', $purchase->project->gallery_token)
                ->with('error', 'No se pudo confirmar el cobro en PayPal. Intenta nuevamente o contacta soporte.');
        }

        $captureId = data_get($capture, 'purchase_units.0.payments.captures.0.id');
        $captureStatus = (string) (data_get($capture, 'purchase_units.0.payments.captures.0.status')
            ?: data_get($capture, 'status')
            ?: 'UNKNOWN');

        $purchase->update([
            'status' => in_array($captureStatus, ['COMPLETED', 'PENDING'], true)
                ? 'processing_webhook'
                : 'failed',
            'provider_capture_id' => $captureId,
            'provider_status' => $captureStatus,
            'payload' => array_merge($purchase->payload ?? [], [
                'paypal_capture_response' => $capture,
            ]),
        ]);

        if (! in_array($captureStatus, ['COMPLETED', 'PENDING'], true)) {
            return redirect()
                ->route('public.gallery.show', $purchase->project->gallery_token)
                ->with('error', 'PayPal no confirmo el cargo. La compra quedo sin aplicar.');
        }

        return redirect()
            ->route('public.gallery.show', $purchase->project->gallery_token)
            ->with('success', 'Pago recibido. Estamos validandolo con PayPal para habilitar el acceso de forma segura.');
    }

    public function paypalCancel(Purchase $purchase)
    {
        $purchase->load('project');
        abort_unless($purchase->project, 404);

        if ($purchase->status !== 'completed') {
            $purchase->update([
                'status' => 'canceled',
                'provider_status' => 'CANCELED_BY_BUYER',
            ]);
        }

        return redirect()
            ->route('public.gallery.show', $purchase->project->gallery_token)
            ->with('error', 'El pago fue cancelado antes de completarse.');
    }

    private function startPayPalCheckout(string $token, string $type)
    {
        $project = Project::where('gallery_token', $token)->firstOrFail();

        try {
            [$amount, $description] = $this->purchaseDefinition($project, $type);

            if (! $this->paypal->enabled()) {
                throw new RuntimeException('PayPal no esta configurado en esta instalacion.');
            }

            $purchase = Purchase::create([
                'tenant_id' => $project->tenant_id,
                'project_id' => $project->id,
                'amount' => $amount,
                'status' => 'pending',
                'gateway' => 'paypal',
                'type' => $type,
                'payload' => [
                    'description' => $description,
                    'extra_download_quota' => $type === 'extra_pack' ? self::EXTRA_PACK_SIZE : 0,
                    'created_via' => 'gallery_checkout',
                ],
            ]);

            $order = $this->paypal->createOrder([
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'reference_id' => 'gallery-purchase-'.$purchase->id,
                    'custom_id' => 'purchase:'.$purchase->id,
                    'description' => $description,
                    'amount' => [
                        'currency_code' => 'USD',
                        'value' => number_format($amount, 2, '.', ''),
                    ],
                ]],
                'application_context' => [
                    'brand_name' => config('app.name', 'PhotOS'),
                    'locale' => 'es-PA',
                    'landing_page' => 'LOGIN',
                    'shipping_preference' => 'NO_SHIPPING',
                    'user_action' => 'PAY_NOW',
                    'return_url' => route('public.gallery.paypal.return', $purchase),
                    'cancel_url' => route('public.gallery.paypal.cancel', $purchase),
                ],
            ]);

            $approvalUrl = collect($order['links'] ?? [])->firstWhere('rel', 'approve')['href'] ?? null;
            $orderId = $order['id'] ?? null;

            if (! $approvalUrl || ! $orderId) {
                $purchase->update([
                    'status' => 'failed',
                    'provider_status' => 'CREATE_ORDER_FAILED',
                    'payload' => array_merge($purchase->payload ?? [], [
                        'paypal_create_order_response' => $order,
                    ]),
                ]);

                throw new RuntimeException('PayPal no devolvio una orden valida para este checkout.');
            }

            $purchase->update([
                'status' => 'awaiting_approval',
                'provider_order_id' => $orderId,
                'provider_status' => (string) ($order['status'] ?? 'CREATED'),
                'payload' => array_merge($purchase->payload ?? [], [
                    'paypal_create_order_response' => $order,
                ]),
            ]);

            return redirect()->away($approvalUrl);
        } catch (\Throwable $e) {
            return redirect()
                ->route('public.gallery.show', $project->gallery_token)
                ->with('error', $e->getMessage());
        }
    }

    private function purchaseDefinition(Project $project, string $type): array
    {
        if ($type === 'full_gallery') {
            if ($project->is_full_gallery_purchased) {
                throw new RuntimeException('La galeria completa ya fue comprada.');
            }

            $amount = (float) $project->full_gallery_price;
            if ($amount <= 0) {
                throw new RuntimeException('El precio de la galeria completa no es valido.');
            }

            return [$amount, 'Desbloqueo de galeria completa para '.$project->name];
        }

        if ($type === 'extra_pack') {
            return [self::EXTRA_PACK_PRICE, 'Paquete extra de descargas para '.$project->name];
        }

        throw new RuntimeException('Tipo de compra no soportado.');
    }
}
