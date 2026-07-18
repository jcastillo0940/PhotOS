<?php

namespace App\Modules\Automations\Tests;

use App\Modules\Automations\Actions\RunAutomationAction;
use App\Modules\Automations\Actions\CompleteTaskAction;
use PHPUnit\Framework\TestCase;

class AutomationActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(RunAutomationAction::class));
        $this->assertTrue(class_exists(CompleteTaskAction::class));
    }
}
