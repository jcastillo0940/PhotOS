<?php

namespace App\Modules\Notifications\Tests;

use App\Modules\Notifications\Actions\SendNotificationAction;
use App\Modules\Notifications\Actions\SendBulkNotificationAction;
use PHPUnit\Framework\TestCase;

class NotificationsActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(SendNotificationAction::class));
        $this->assertTrue(class_exists(SendBulkNotificationAction::class));
    }
}
