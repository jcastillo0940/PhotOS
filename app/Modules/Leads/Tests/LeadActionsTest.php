<?php

namespace App\Modules\Leads\Tests;

use App\Modules\Leads\Actions\CreateLeadAction;
use App\Modules\Leads\Actions\UpdateLeadStatusAction;
use App\Modules\Leads\Events\LeadCreated;
use App\Modules\Leads\Events\LeadStatusChanged;
use PHPUnit\Framework\TestCase;

class LeadActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(CreateLeadAction::class));
        $this->assertTrue(class_exists(UpdateLeadStatusAction::class));
    }

    public function test_event_classes_exist(): void
    {
        $this->assertTrue(class_exists(LeadCreated::class));
        $this->assertTrue(class_exists(LeadStatusChanged::class));
    }
}
