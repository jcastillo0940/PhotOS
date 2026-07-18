<?php

namespace App\Modules\Integrations\Events;

use App\Models\WebhookEndpoint;

class WebhookDispatched
{
    public function __construct(
        public readonly WebhookEndpoint $endpoint,
        public readonly string $event,
        public readonly bool $success,
    ) {}
}
