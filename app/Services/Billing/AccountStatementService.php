<?php

namespace App\Services\Billing;

use App\Models\AccountStatement;
use App\Models\Invoice;
use App\Models\Payment;

class AccountStatementService
{
    public function recordInvoice(Invoice $invoice): void
    {
        if (!$invoice->client_id) {
            return;
        }

        AccountStatement::create([
            'client_id' => $invoice->client_id,
            'project_id' => $invoice->project_id,
            'invoice_id' => $invoice->id,
            'entry_type' => 'invoice',
            'reference' => $invoice->invoice_number,
            'description' => 'Emision de factura: '.$invoice->concept,
            'amount' => $invoice->total,
            'occurred_at' => now(),
        ]);
    }

    public function recordPayment(Payment $payment): void
    {
        if (!$payment->client_id) {
            return;
        }

        AccountStatement::create([
            'client_id' => $payment->client_id,
            'project_id' => $payment->invoice?->project_id,
            'invoice_id' => $payment->invoice_id,
            'payment_id' => $payment->id,
            'entry_type' => 'payment',
            'reference' => $payment->reference,
            'description' => 'Pago recibido',
            'amount' => -1 * (float) $payment->amount,
            'occurred_at' => $payment->paid_at ?? now(),
        ]);
    }
}
