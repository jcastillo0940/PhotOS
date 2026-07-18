<?php

namespace App\Modules\Reports\Tests;

use App\Modules\Reports\Actions\GenerateDashboardDataAction;
use PHPUnit\Framework\TestCase;

class ReportsActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(GenerateDashboardDataAction::class));
    }
}
