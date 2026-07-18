<?php

namespace App\Modules\Billing\Events;

use App\Models\Invoice;
use App\Models\Payment;

class PaymentReceived
{
    public function __construct(
        public readonly Payment $payment,
        public readonly Invoice $invoice,
    ) {}
}
