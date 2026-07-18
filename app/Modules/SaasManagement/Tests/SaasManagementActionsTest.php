<?php

namespace App\Modules\SaasManagement\Tests;

use App\Modules\SaasManagement\Actions\ProvisionTenantAction;
use App\Modules\SaasManagement\Actions\SuspendTenantAction;
use App\Modules\SaasManagement\Events\TenantProvisioned;
use App\Modules\SaasManagement\Events\TenantSuspended;
use PHPUnit\Framework\TestCase;

class SaasManagementActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(ProvisionTenantAction::class));
        $this->assertTrue(class_exists(SuspendTenantAction::class));
    }

    public function test_event_classes_exist(): void
    {
        $this->assertTrue(class_exists(TenantProvisioned::class));
        $this->assertTrue(class_exists(TenantSuspended::class));
    }
}
