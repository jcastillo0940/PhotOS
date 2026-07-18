<?php

namespace App\Modules\Billing\Tests;

use App\Modules\Billing\Actions\CreateInvoiceAction;
use App\Modules\Billing\Actions\RecordPaymentAction;
use App\Modules\Billing\Actions\ApplyDiscountAction;
use App\Modules\Billing\Events\InvoiceCreated;
use App\Modules\Billing\Events\PaymentReceived;
use PHPUnit\Framework\TestCase;

class BillingActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(CreateInvoiceAction::class));
        $this->assertTrue(class_exists(RecordPaymentAction::class));
        $this->assertTrue(class_exists(ApplyDiscountAction::class));
    }

    public function test_event_classes_exist(): void
    {
        $this->assertTrue(class_exists(InvoiceCreated::class));
        $this->assertTrue(class_exists(PaymentReceived::class));
    }
}
