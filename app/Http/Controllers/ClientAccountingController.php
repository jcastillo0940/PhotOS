<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Inertia\Inertia;

class ClientAccountingController extends Controller
{
    public function show(Client $client)
    {
        $client->load([
            'projects.lead',
            'invoices.project',
            'payments.invoice',
            'statements' => fn ($query) => $query->latest('occurred_at'),
        ]);

        return Inertia::render('Admin/Clients/Accounting', [
            'client' => [
                'id' => $client->id,
                'full_name' => $client->full_name,
                'email' => $client->email,
                'phone' => $client->phone,
                'is_recurring' => (bool) $client->is_recurring,
                'projects' => $client->projects->map(fn ($project) => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status,
                    'event_date' => optional($project->event_date)?->toDateString(),
                    'lead_name' => $project->lead?->name,
                ])->values(),
                'invoices' => $client->invoices->sortByDesc('created_at')->map(fn ($invoice) => [
                    'id' => $invoice->id,
                    'project_id' => $invoice->project_id,
                    'invoice_number' => $invoice->invoice_number,
                    'concept' => $invoice->concept,
                    'status' => $invoice->status,
                    'total' => (float) $invoice->total,
                    'balance_due' => (float) $invoice->balance_due,
                    'alanube_status' => $invoice->alanube_status,
                    'due_date' => optional($invoice->due_date)?->toDateString(),
                ])->values(),
                'payments' => $client->payments->sortByDesc('paid_at')->map(fn ($payment) => [
                    'id' => $payment->id,
                    'invoice_id' => $payment->invoice_id,
                    'amount' => (float) $payment->amount,
                    'method' => $payment->method,
                    'reference' => $payment->reference,
                    'paid_at' => optional($payment->paid_at)?->toDateString(),
                ])->values(),
                'statements' => $client->statements->map(fn ($entry) => [
                    'id' => $entry->id,
                    'entry_type' => $entry->entry_type,
                    'reference' => $entry->reference,
                    'description' => $entry->description,
                    'amount' => (float) $entry->amount,
                    'occurred_at' => optional($entry->occurred_at)?->toDateString(),
                ])->values(),
                'summary' => [
                    'open_balance' => (float) $client->invoices->sum('balance_due'),
                    'invoice_count' => $client->invoices->count(),
                    'project_count' => $client->projects->count(),
                    'payment_total' => (float) $client->payments->sum('amount'),
                ],
            ],
        ]);
    }
}
