<?php

namespace App\Services\Saas;

use App\Models\TenantDomain;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class CloudflareCustomHostnameService
{
    public function enabled(): bool
    {
        return filled(config('services.cloudflare_saas.api_token'))
            && filled(config('services.cloudflare_saas.zone_id'));
    }

    public function managedCnameTarget(): ?string
    {
        $configuredTarget = config('services.cloudflare_saas.managed_cname_target');

        if (filled($configuredTarget)) {
            return $configuredTarget;
        }

        $appHost = parse_url((string) config('app.url'), PHP_URL_HOST);

        return filled($appHost) ? $appHost : null;
    }

    public function dcvTarget(): ?string
    {
        return config('services.cloudflare_saas.dcv_target');
    }

    public function createCustomHostname(TenantDomain $domain): array
    {
        if (!$this->enabled()) {
            throw new RuntimeException('Cloudflare for SaaS no esta configurado en este entorno.');
        }

        $response = $this->request()
            ->post($this->endpoint(), [
                'hostname' => $domain->hostname,
                'ssl' => [
                    'method' => 'txt',
                    'type' => 'dv',
                ],
            ]);

        $payload = $this->parseResponse($response);

        return $this->persistCloudflareState($domain, $payload);
    }

    public function refreshStatus(TenantDomain $domain): array
    {
        if (!$this->enabled()) {
            throw new RuntimeException('Cloudflare for SaaS no esta configurado en este entorno.');
        }

        if (! $domain->cf_custom_hostname_id) {
            return $this->createCustomHostname($domain);
        }

        $response = $this->request()->get($this->endpoint('/'.$domain->cf_custom_hostname_id));

        $payload = $this->parseResponse($response);

        return $this->persistCloudflareState($domain, $payload);
    }

    public function dnsInstructions(TenantDomain $domain): array
    {
        $metadata = $domain->metadata ?? [];
        $ownership = $metadata['ownership_verification'] ?? [];
        $validation = $metadata['ssl_validation'] ?? [];
        $delegated = $metadata['dcv_delegation'] ?? [];

        $delegatedName = $delegated['cname'] ?? $this->delegatedDcvRecordName($domain->hostname);
        $delegatedTarget = $delegated['cname_target'] ?? $this->delegatedDcvRecordTarget($domain->hostname);
        $hasDelegatedDcv = filled($delegatedName) && filled($delegatedTarget);
        $validationRecord = $hasDelegatedDcv
            ? [
                'type' => 'CNAME',
                'name' => $delegatedName,
                'value' => $delegatedTarget,
                'mode' => 'delegated_cname',
            ]
            : [
                'type' => 'TXT',
                'name' => $ownership['name'] ?? $validation['txt_name'] ?? null,
                'value' => $ownership['value'] ?? $validation['txt_value'] ?? null,
                'mode' => 'txt',
            ];

        return [
            'cname' => [
                'type' => 'CNAME',
                'name' => $domain->hostname,
                'target' => $this->managedCnameTarget(),
            ],
            'txt' => $validationRecord,
        ];
    }

    protected function request()
    {
        return Http::baseUrl('https://api.cloudflare.com/client/v4')
            ->acceptJson()
            ->withToken(config('services.cloudflare_saas.api_token'))
            ->timeout(20);
    }

    protected function endpoint(string $suffix = ''): string
    {
        return '/zones/'.config('services.cloudflare_saas.zone_id').'/custom_hostnames'.$suffix;
    }

    protected function parseResponse(Response $response): array
    {
        if ($response->failed()) {
            throw new RuntimeException($response->json('errors.0.message') ?: ('Cloudflare respondio con '.$response->status().'.'));
        }

        $result = $response->json('result');

        if (!$result) {
            throw new RuntimeException('Cloudflare no devolvio datos del custom hostname.');
        }

        return $result;
    }

    protected function persistCloudflareState(TenantDomain $domain, array $payload): array
    {
        $ownership = $payload['ownership_verification'] ?? [];
        $ssl = $payload['ssl'] ?? [];
        $delegated = $ssl['dcv_delegation_records'][0]
            ?? $payload['dcv_delegation_records'][0]
            ?? [];

        $domain->forceFill([
            'cf_custom_hostname_id' => $payload['id'] ?? $domain->cf_custom_hostname_id,
            'cf_status' => $ssl['status'] ?? $payload['status'] ?? 'pending',
            'verification_method' => $ssl['method'] ?? $domain->verification_method ?? 'txt',
            'verified_at' => in_array(($ssl['status'] ?? null), ['active', 'pending_deployment'], true) ? now() : $domain->verified_at,
            'metadata' => array_merge($domain->metadata ?? [], [
                'ownership_verification' => [
                    'name' => $ownership['name'] ?? null,
                    'value' => $ownership['value'] ?? null,
                    'type' => $ownership['type'] ?? 'txt',
                ],
                'ssl_validation' => [
                    'status' => $ssl['status'] ?? null,
                    'method' => $ssl['method'] ?? null,
                    'txt_name' => $ssl['validation_records'][0]['txt_name'] ?? null,
                    'txt_value' => $ssl['validation_records'][0]['txt_value'] ?? null,
                ],
                'dcv_delegation' => [
                    'cname' => $delegated['cname'] ?? $this->delegatedDcvRecordName($domain->hostname),
                    'cname_target' => $delegated['cname_target'] ?? $this->delegatedDcvRecordTarget($domain->hostname),
                    'status' => $delegated['status'] ?? null,
                ],
                'raw_cloudflare' => $payload,
            ]),
        ])->save();

        return [
            'domain' => $domain->fresh(),
            'instructions' => $this->dnsInstructions($domain->fresh()),
        ];
    }

    protected function delegatedDcvRecordName(string $hostname): string
    {
        return '_acme-challenge.'.$hostname;
    }

    protected function delegatedDcvRecordTarget(string $hostname): ?string
    {
        $suffix = trim((string) config('services.cloudflare_saas.dcv_target'), '.');

        if ($suffix === '') {
            return null;
        }

        return trim($hostname, '.').'.'.$suffix;
    }
}
