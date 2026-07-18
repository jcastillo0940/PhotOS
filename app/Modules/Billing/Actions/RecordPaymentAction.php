<?php

namespace App\Modules\Billing\Actions;

use App\Models\Invoice;
use App\Models\Payment;
use App\Modules\Billing\Events\PaymentReceived;
use Illuminate\Support\Facades\Event;

class RecordPaymentAction
{
    public function execute(Invoice $invoice, array $paymentData): Payment
    {
        $payment = Payment::create(array_merge($paymentData, [
            'invoice_id' => $invoice->id,
            'tenant_id'  => $invoice->tenant_id,
        ]));

        $invoice->updateBalanceDue();

        Event::dispatch(new PaymentReceived($payment, $invoice->fresh()));

        return $payment;
    }
}
