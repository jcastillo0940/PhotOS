<?php

namespace App\Modules\Integrations\Actions;

use App\Models\WebhookEndpoint;
use App\Modules\Integrations\Jobs\DispatchWebhookJob;

class DispatchWebhookAction
{
    public function execute(string $event, array $payload, ?int $tenantId = null): void
    {
        $endpoints = WebhookEndpoint::query()
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('is_active', true)
            ->whereJsonContains('events', $event)
            ->get();

        foreach ($endpoints as $endpoint) {
            DispatchWebhookJob::dispatch($endpoint, $event, $payload);
        }
    }
}
