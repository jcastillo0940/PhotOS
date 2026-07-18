<?php

namespace App\Modules\Integrations\Tests;

use App\Modules\Integrations\Actions\DispatchWebhookAction;
use App\Modules\Integrations\Events\WebhookDispatched;
use PHPUnit\Framework\TestCase;

class IntegrationsActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(DispatchWebhookAction::class));
    }

    public function test_event_classes_exist(): void
    {
        $this->assertTrue(class_exists(WebhookDispatched::class));
    }
}
