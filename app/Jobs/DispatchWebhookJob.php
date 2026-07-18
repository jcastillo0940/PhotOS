<?php

namespace App\Jobs;

use App\Models\WebhookDelivery;
use App\Models\WebhookEndpoint;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class DispatchWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;
    public int $timeout = 20;

    private string $deliveryId;

    public function __construct(
        private readonly WebhookEndpoint $endpoint,
        private readonly string $eventType,
        private readonly array $data,
    ) {
        $this->onQueue('default');
        $this->deliveryId = Str::uuid()->toString();
    }

    public function handle(): void
    {
        $body = json_encode([
            'event'     => $this->eventType,
            'timestamp' => now()->toIso8601String(),
            'delivery'  => $this->deliveryId,
            'data'      => $this->data,
        ], JSON_UNESCAPED_UNICODE);

        $signature = 'sha256=' . hash_hmac('sha256', $body, $this->endpoint->secret);

        $delivery = WebhookDelivery::create([
            'webhook_endpoint_id' => $this->endpoint->id,
            'tenant_id'           => $this->endpoint->tenant_id,
            'event_type'          => $this->eventType,
            'delivery_id'         => $this->deliveryId,
            'payload'             => $this->data,
            'status'              => 'pending',
            'attempt'             => $this->attempts(),
        ]);

        try {
            $start    = microtime(true);
            $response = Http::timeout(15)
                ->withHeaders([
                    'Content-Type'         => 'application/json',
                    'X-Webhook-Signature'  => $signature,
                    'X-Webhook-Event'      => $this->eventType,
                    'X-Webhook-Delivery'   => $this->deliveryId,
                ])
                ->withBody($body, 'application/json')
                ->post($this->endpoint->url);

            $duration = (int) ((microtime(true) - $start) * 1000);
            $success  = $response->successful();

            $delivery->update([
                'status'        => $success ? 'success' : 'failed',
                'response_code' => $response->status(),
                'response_body' => Str::limit($response->body(), 2000),
                'duration_ms'   => $duration,
                'delivered_at'  => now(),
            ]);

            $this->endpoint->updateQuietly([
                'last_response_code' => $response->status(),
                'last_delivered_at'  => now(),
            ]);

            if (! $success) {
                throw new \RuntimeException("Endpoint respondio {$response->status()}");
            }
        } catch (\Throwable $e) {
            $delivery->update(['status' => 'failed']);
            throw $e;
        }
    }

    public function failed(\Throwable $e): void
    {
        WebhookDelivery::where('delivery_id', $this->deliveryId)
            ->update(['status' => 'failed']);
    }
}
