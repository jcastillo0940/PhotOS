<?php

namespace App\Services\Saas;

use App\Models\Setting;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class CloudflareDnsService
{
    public function enabled(): bool
    {
        return filled($this->apiToken()) && filled($this->accountId());
    }

    public function ensureVanityRecords(string $zoneName, string $hostname, string $cnameTarget, ?string $dcvSuffix = null): array
    {
        if (! $this->enabled()) {
            throw new RuntimeException('Cloudflare DNS no esta configurado en este entorno.');
        }

        $zoneId = $this->zoneIdFor($zoneName);

        if (! $zoneId) {
            throw new RuntimeException("Cloudflare DNS aun no expone una zona editable para {$zoneName}.");
        }

        $records = [];
        $records[] = $this->upsertRecord($zoneId, [
            'type' => 'CNAME',
            'name' => $hostname,
            'content' => $cnameTarget,
            'proxied' => false,
            'ttl' => 1,
        ]);

        if (filled($dcvSuffix)) {
            $records[] = $this->upsertRecord($zoneId, [
                'type' => 'CNAME',
                'name' => '_acme-challenge.'.$hostname,
                'content' => trim($hostname, '.').'.'.trim((string) $dcvSuffix, '.'),
                'proxied' => false,
                'ttl' => 1,
            ]);
        }

        return $records;
    }

    public function zoneIdFor(string $zoneName): ?string
    {
        $response = $this->request()->get('/zones', [
            'account.id' => $this->accountId(),
            'name' => strtolower(trim($zoneName)),
            'per_page' => 1,
        ]);

        $result = $this->parseResponse($response);

        return $result[0]['id'] ?? null;
    }

    protected function upsertRecord(string $zoneId, array $payload): array
    {
        $recordName = strtolower(trim((string) $payload['name']));
        $type = strtoupper(trim((string) $payload['type']));

        $existing = $this->request()->get("/zones/{$zoneId}/dns_records", [
            'name' => $recordName,
            'type' => $type,
            'per_page' => 1,
        ]);

        $records = $this->parseResponse($existing);
        $recordId = $records[0]['id'] ?? null;

        $response = $recordId
            ? $this->request()->put("/zones/{$zoneId}/dns_records/{$recordId}", $payload)
            : $this->request()->post("/zones/{$zoneId}/dns_records", $payload);

        return $this->parseSingleResponse($response);
    }

    protected function request()
    {
        return Http::baseUrl('https://api.cloudflare.com/client/v4')
            ->acceptJson()
            ->withToken($this->apiToken())
            ->timeout(30);
    }

    protected function parseResponse(Response $response): array
    {
        if ($response->failed()) {
            throw new RuntimeException($response->json('errors.0.message') ?: ('Cloudflare DNS respondio con '.$response->status().'.'));
        }

        $result = $response->json('result');

        return is_array($result) ? $result : [];
    }

    protected function parseSingleResponse(Response $response): array
    {
        if ($response->failed()) {
            throw new RuntimeException($response->json('errors.0.message') ?: ('Cloudflare DNS respondio con '.$response->status().'.'));
        }

        $result = $response->json('result');

        if (! is_array($result)) {
            throw new RuntimeException('Cloudflare DNS no devolvio un registro valido.');
        }

        return $result;
    }

    protected function accountId(): ?string
    {
        return Setting::getForTenant(null, 'cloudflare_account_id');
    }

    protected function apiToken(): ?string
    {
        return Setting::getForTenant(null, 'cloudflare_dns_api_token')
            ?: Setting::getForTenant(null, 'cloudflare_registrar_api_token')
            ?: Setting::getForTenant(null, 'cloudflare_saas_api_token');
    }
}
