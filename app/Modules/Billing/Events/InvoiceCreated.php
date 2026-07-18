<?php

namespace App\Modules\Billing\Events;

use App\Models\Invoice;

class InvoiceCreated
{
    public function __construct(public readonly Invoice $invoice) {}
}
