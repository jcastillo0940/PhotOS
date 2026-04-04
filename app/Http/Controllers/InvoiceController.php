<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Setting;
use App\Services\Billing\AccountStatementService;
use App\Services\Billing\AlanubeService;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly AccountStatementService $statementService,
        private readonly AlanubeService $alanubeService,
    ) {}

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'concept' => 'required|string|max:255',
            'due_date' => 'required|date',
            'itbms_enabled' => 'nullable|boolean',
            'alanube_enabled' => 'nullable|boolean',
        ]);

        $subtotal = (float) $validated['amount'];
        $globalItbmsEnabled = filter_var(Setting::get('tax_itbms_enabled', '1'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true;
        $globalAlanubeEnabled = filter_var(Setting::get('alanube_enabled', '0'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false;
        $itbmsEnabled = array_key_exists('itbms_enabled', $validated)
            ? (bool) $validated['itbms_enabled']
            : $globalItbmsEnabled;
        $alanubeEnabled = array_key_exists('alanube_enabled', $validated)
            ? ((bool) $validated['alanube_enabled'] && $globalAlanubeEnabled)
            : $globalAlanubeEnabled;
        $taxRate = $itbmsEnabled ? (float) Setting::get('tax_itbms_rate', 7) : 0.0;
        $taxAmount = round($subtotal * ($taxRate / 100), 2);
        $total = round($subtotal + $taxAmount, 2);

        $invoice = $project->invoices()->create([
            'client_id' => $project->client_id,
            'amount' => $total,
            'subtotal' => $subtotal,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'balance_due' => $total,
            'concept' => $validated['concept'],
            'due_date' => $validated['due_date'],
            'status' => 'unpaid',
            'itbms_enabled' => $itbmsEnabled,
            'alanube_enabled' => $alanubeEnabled,
            'alanube_status' => $alanubeEnabled ? 'pending' : 'disabled',
            'invoice_number' => 'INV-'.str_pad((string) ((Invoice::max('id') ?? 0) + 1), 6, '0', STR_PAD_LEFT),
        ]);

        $this->statementService->recordInvoice($invoice);

        return redirect()->back()->with('success', 'Invoice generated successfully.');
    }

    public function markAsPaid(Invoice $invoice)
    {
        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'client_id' => $invoice->client_id,
            'amount' => $invoice->balance_due,
            'status' => 'completed',
            'method' => 'manual',
            'reference' => 'FULL-'.$invoice->invoice_number,
            'paid_at' => now(),
        ]);

        $invoice->update([
            'status' => 'paid',
            'balance_due' => 0,
        ]);

        $this->statementService->recordPayment($payment);
        return redirect()->back()->with('success', 'Payment recorded.');
    }

    public function toggleTax(Invoice $invoice)
    {
        $itbmsEnabled = !$invoice->itbms_enabled;
        $taxRate = $itbmsEnabled ? (float) \App\Models\Setting::get('tax_itbms_rate', 7) : 0.0;
        $taxAmount = round(((float) $invoice->subtotal) * ($taxRate / 100), 2);
        $total = round(((float) $invoice->subtotal) + $taxAmount, 2);

        $invoice->update([
            'itbms_enabled' => $itbmsEnabled,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'amount' => $total,
            'balance_due' => $invoice->status === 'paid' ? 0 : $total,
        ]);

        return redirect()->back()->with('success', 'ITBMS actualizado.');
    }

    public function recordPayment(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'method' => 'nullable|string|max:100',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'client_id' => $invoice->client_id,
            'amount' => min((float) $validated['amount'], (float) $invoice->balance_due),
            'status' => 'completed',
            'method' => $validated['method'] ?? 'manual',
            'reference' => $validated['reference'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'paid_at' => now(),
        ]);

        $remainingBalance = max(0, round((float) $invoice->balance_due - (float) $payment->amount, 2));

        $invoice->update([
            'balance_due' => $remainingBalance,
            'status' => $remainingBalance <= 0 ? 'paid' : 'partially_paid',
        ]);

        $this->statementService->recordPayment($payment);

        return redirect()->back()->with('success', 'Pago registrado.');
    }

    public function submitAlanube(Invoice $invoice)
    {
        $invoice->loadMissing('project.lead', 'client');
        $result = $this->alanubeService->submitInvoice($invoice);

        if (!$result['ok']) {
            $invoice->update([
                'alanube_status' => 'rejected',
                'alanube_response' => $result['body'] ?? ['message' => $result['message']],
            ]);

            return redirect()->back()->with('error', $result['message']);
        }

        $document = data_get($result, 'data.document', []);

        $invoice->update([
            'alanube_status' => 'submitted',
            'alanube_document_id' => data_get($document, 'id'),
            'alanube_legal_status' => data_get($document, 'legalStatus'),
            'alanube_cufe' => data_get($document, 'cufe'),
            'alanube_xml_url' => data_get($document, 'xml'),
            'alanube_qr_url' => data_get($document, 'qr'),
            'alanube_response' => $result['data'] ?? null,
            'alanube_submitted_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Factura enviada a Alanube.');
    }

    public function pdf(Invoice $invoice)
    {
        $invoice->loadMissing('project.lead', 'project.client', 'client', 'payments');
        config(['dompdf.public_path' => base_path('public_html')]);

        $branding = [
            'app_name' => Setting::get('app_name', config('app.name', 'PhotOS')),
            'app_tagline' => Setting::get('app_tagline', 'Admin platform'),
            'logo_path' => Setting::get('app_logo_path'),
        ];

        $issuer = [
            'business_name' => Setting::get('photographer_business_name', $branding['app_name']),
            'document' => Setting::get('photographer_document', 'RUC'),
            'city' => Setting::get('legal_city', 'Panama'),
            'country' => Setting::get('jurisdiction_country', 'Panama'),
        ];

        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoice,
            'branding' => $branding,
            'issuer' => $issuer,
        ])->setPaper('letter');

        $filename = ($invoice->invoice_number ?: 'invoice-'.$invoice->id).'.pdf';

        return $pdf->download($filename);
    }
}
