<?php

namespace App\Modules\Contracts\Tests;

use App\Modules\Contracts\Actions\SignContractAction;
use App\Modules\Contracts\Actions\GenerateContractPdfAction;
use App\Modules\Contracts\Events\ContractSigned;
use PHPUnit\Framework\TestCase;

class ContractActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(SignContractAction::class));
        $this->assertTrue(class_exists(GenerateContractPdfAction::class));
    }

    public function test_event_classes_exist(): void
    {
        $this->assertTrue(class_exists(ContractSigned::class));
    }
}
