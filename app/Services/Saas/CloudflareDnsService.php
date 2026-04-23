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
        return filled($this->apiToken());
    }

    public function ensureVanityRecords(string $zoneName, string $hostname, string $cnameTarget, ?string $dcvSuffix = null, ?array $validationRecord = null): array
    {
        if (! $this->enabled()) {
            throw new RuntimeException('Cloudflare DNS no esta configurado en este entorno.');
        }

        $zone = $this->zoneDetailsFor($zoneName);
        $zoneId = $zone['id'] ?? null;

        if (! $zoneId) {
            throw new RuntimeException("Cloudflare DNS aun no expone una zona editable para {$zoneName}.");
        }

        if (($zone['status'] ?? null) !== 'active') {
            throw new RuntimeException("La zona {$zoneName} existe en Cloudflare, pero aun no esta activa. Revisa que el dominio use los nameservers de Cloudflare.");
        }

        $records = [];
        $records[] = $this->upsertRecord($zoneId, [
            'type' => 'CNAME',
            'name' => $hostname,
            'content' => $cnameTarget,
            'proxied' => false,
            'ttl' => 1,
        ]);

        if ($this->isApexHostname($zoneName, $hostname)) {
            $records[] = $this->upsertRecord($zoneId, [
                'type' => 'CNAME',
                'name' => 'www.'.$zoneName,
                'content' => $cnameTarget,
                'proxied' => false,
                'ttl' => 1,
            ]);
        }

        if (is_array($validationRecord) && filled($validationRecord['name'] ?? null) && filled($validationRecord['value'] ?? null)) {
            $validationPayload = [
                'type' => strtoupper((string) ($validationRecord['type'] ?? 'TXT')),
                'name' => $validationRecord['name'],
                'content' => $validationRecord['value'],
                'ttl' => 1,
            ];

            if ($validationPayload['type'] === 'CNAME') {
                $validationPayload['proxied'] = false;
            }

            $records[] = $this->upsertRecord($zoneId, $validationPayload);
        } elseif (filled($dcvSuffix)) {
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

    public function zoneDetailsFor(string $zoneName): ?array
    {
        $query = [
            'name' => strtolower(trim($zoneName)),
            'per_page' => 1,
        ];

        if (filled($this->accountId())) {
            $query['account.id'] = $this->accountId();
        }

        $response = $this->request()->get('/zones', $query);

        $result = $this->parseResponse($response);

        return $result[0] ?? null;
    }

    public function zoneIdFor(string $zoneName): ?string
    {
        return $this->zoneDetailsFor($zoneName)['id'] ?? null;
    }

    protected function upsertRecord(string $zoneId, array $payload): array
    {
        $recordName = strtolower(trim((string) $payload['name']));
        $type = strtoupper(trim((string) $payload['type']));

        $recordsForName = $this->request()->get("/zones/{$zoneId}/dns_records", [
            'name' => $recordName,
            'per_page' => 100,
        ]);

        $records = $this->parseResponse($recordsForName);
        $recordId = collect($records)->firstWhere('type', $type)['id'] ?? null;

        $this->deleteConflictingRecords($zoneId, $records, $type, $recordName);

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

    protected function deleteConflictingRecords(string $zoneId, array $records, string $targetType, string $recordName): void
    {
        if ($targetType !== 'CNAME') {
            return;
        }

        foreach ($records as $record) {
            $type = strtoupper((string) ($record['type'] ?? ''));
            $id = $record['id'] ?? null;

            if (! $id || $type === 'CNAME') {
                continue;
            }

            $isApexOrWwwAddressConflict = in_array($type, ['A', 'AAAA'], true);
            $isDcvConflict = str_starts_with($recordName, '_acme-challenge.');

            if (! $isApexOrWwwAddressConflict && ! $isDcvConflict) {
                continue;
            }

            $response = $this->request()->delete("/zones/{$zoneId}/dns_records/{$id}");

            if ($response->failed()) {
                throw new RuntimeException($response->json('errors.0.message') ?: ('Cloudflare DNS no pudo eliminar un registro conflictivo '.$type.'.'));
            }
        }
    }

    protected function isApexHostname(string $zoneName, string $hostname): bool
    {
        return strtolower(trim($zoneName, '.')) === strtolower(trim($hostname, '.'));
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
