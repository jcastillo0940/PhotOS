<?php

namespace App\Services\Billing;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PayPalApiService
{
    public function enabled(): bool
    {
        return (bool) ($this->clientId() && $this->secret());
    }

    public function environment(): string
    {
        return config('services.paypal.environment', 'sandbox');
    }

    public function baseUrl(): string
    {
        return $this->environment() === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    public function createProduct(array $payload): array
    {
        return $this->request()->post('/v1/catalogs/products', $payload)->throw()->json();
    }

    public function createPlan(array $payload): array
    {
        return $this->request()->post('/v1/billing/plans', $payload)->throw()->json();
    }

    public function createSubscription(array $payload): array
    {
        return $this->request()->post('/v1/billing/subscriptions', $payload)->throw()->json();
    }

    public function getSubscription(string $subscriptionId): array
    {
        return $this->request()->get("/v1/billing/subscriptions/{$subscriptionId}")->throw()->json();
    }

    public function activateSubscription(string $subscriptionId, string $reason = 'Reactivated by platform'): void
    {
        $this->request()->post("/v1/billing/subscriptions/{$subscriptionId}/activate", ['reason' => $reason])->throw();
    }

    public function suspendSubscription(string $subscriptionId, string $reason = 'Suspended by platform'): void
    {
        $this->request()->post("/v1/billing/subscriptions/{$subscriptionId}/suspend", ['reason' => $reason])->throw();
    }

    public function cancelSubscription(string $subscriptionId, string $reason = 'Cancelled by platform'): void
    {
        $this->request()->post("/v1/billing/subscriptions/{$subscriptionId}/cancel", ['reason' => $reason])->throw();
    }

    public function createSetupToken(array $payload): array
    {
        return $this->request()->post('/v3/vault/setup-tokens', $payload)->throw()->json();
    }

    public function verifyWebhookSignature(array $payload): array
    {
        return $this->request()->post('/v1/notifications/verify-webhook-signature', $payload)->throw()->json();
    }

    public function accessToken(): string
    {
        $response = Http::asForm()
            ->withBasicAuth($this->clientId(), $this->secret())
            ->post($this->baseUrl().'/v1/oauth2/token', ['grant_type' => 'client_credentials'])
            ->throw()
            ->json();

        return (string) ($response['access_token'] ?? throw new RuntimeException('PayPal no devolvio access_token.'));
    }

    private function request(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl())
            ->withToken($this->accessToken())
            ->acceptJson()
            ->asJson();
    }

    private function clientId(): ?string
    {
        return config('services.paypal.client_id');
    }

    private function secret(): ?string
    {
        return config('services.paypal.secret');
    }
}