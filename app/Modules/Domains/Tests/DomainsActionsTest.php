<?php

namespace App\Modules\Domains\Tests;

use App\Modules\Domains\Actions\ConnectDomainAction;
use App\Modules\Domains\Events\DomainConnected;
use PHPUnit\Framework\TestCase;

class DomainsActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(ConnectDomainAction::class));
    }

    public function test_event_classes_exist(): void
    {
        $this->assertTrue(class_exists(DomainConnected::class));
    }
}
