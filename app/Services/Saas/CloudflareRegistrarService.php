<?php

namespace App\Services\Saas;

use App\Models\Setting;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class CloudflareRegistrarService
{
    public function enabled(): bool
    {
        return filled($this->accountId()) && filled($this->apiToken());
    }

    public function search(string $query, int $limit = 8): array
    {
        if (! $this->enabled()) {
            throw new RuntimeException('Cloudflare Registrar no esta configurado en este entorno.');
        }

        $response = $this->request()->get("/accounts/{$this->accountId()}/registrar/domain-search", [
            'q' => trim($query),
            'limit' => max(1, min($limit, 20)),
        ]);

        $domains = $this->parseResponse($response, 'domains');

        return collect($domains)
            ->map(function (array $domain) {
                return [
                    'domain_name' => (string) ($domain['domain_name'] ?? $domain['name'] ?? ''),
                    'available' => (bool) ($domain['available'] ?? $domain['is_available'] ?? false),
                    'currency' => (string) ($domain['currency'] ?? 'USD'),
                    'purchase_price' => $domain['purchase_price']
                        ?? data_get($domain, 'pricing.purchase')
                        ?? data_get($domain, 'pricing.registration')
                        ?? null,
                    'renewal_price' => $domain['renewal_price']
                        ?? data_get($domain, 'pricing.renewal')
                        ?? null,
                    'raw' => $domain,
                ];
            })
            ->filter(fn (array $domain) => filled($domain['domain_name']))
            ->values()
            ->all();
    }

    public function registerDomain(string $domainName): array
    {
        if (! $this->enabled()) {
            throw new RuntimeException('Cloudflare Registrar no esta configurado en este entorno.');
        }

        $response = $this->request()->post("/accounts/{$this->accountId()}/registrar/registrations", [
            'domain_name' => strtolower(trim($domainName)),
        ]);

        return $this->parseResponse($response);
    }

    protected function request()
    {
        return Http::baseUrl('https://api.cloudflare.com/client/v4')
            ->acceptJson()
            ->withToken($this->apiToken())
            ->timeout(30);
    }

    protected function parseResponse(Response $response, ?string $resultKey = null): array
    {
        if ($response->failed()) {
            throw new RuntimeException($response->json('errors.0.message') ?: ('Cloudflare Registrar respondio con '.$response->status().'.'));
        }

        $result = $response->json('result');

        if ($resultKey !== null) {
            $nested = Arr::get($result ?? [], $resultKey);

            if (is_array($nested)) {
                return $nested;
            }
        }

        if (! is_array($result)) {
            throw new RuntimeException('Cloudflare Registrar no devolvio datos validos.');
        }

        return $result;
    }

    protected function accountId(): ?string
    {
        return Setting::getForTenant(null, 'cloudflare_account_id');
    }

    protected function apiToken(): ?string
    {
        return Setting::getForTenant(null, 'cloudflare_registrar_api_token')
            ?: Setting::getForTenant(null, 'cloudflare_saas_api_token');
    }
}
