<?php

namespace App\Modules\Tenancy\Tests;

use App\Modules\Tenancy\Actions\UpdateBrandingAction;
use App\Modules\Tenancy\Actions\UpdateSettingsAction;
use PHPUnit\Framework\TestCase;

class TenancyActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(UpdateBrandingAction::class));
        $this->assertTrue(class_exists(UpdateSettingsAction::class));
    }
}
