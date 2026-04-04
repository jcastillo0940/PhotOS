<?php

namespace App\Http\Controllers;

use App\Models\AccountStatement;
use App\Models\Project;
use Inertia\Inertia;

class ClientDashboardController extends Controller
{
    public function index()
    {
        $user = request()->user();
        $clientId = $user->client_id;

        if (!$clientId) {
            $matchedClient = \App\Models\Client::where('email', $user->email)->first();

            if ($matchedClient) {
                $user->update(['client_id' => $matchedClient->id]);
                $clientId = $matchedClient->id;
            }
        }

        $projects = Project::query()
            ->with(['lead', 'client', 'invoices', 'photos'])
            ->when($clientId, fn ($query) => $query->where('client_id', $clientId))
            ->unless($clientId, fn ($query) => $query->whereRaw('1 = 0'))
            ->latest()
            ->get();

        $invoices = $projects
            ->flatMap->invoices
            ->sortByDesc('created_at')
            ->values();

        $statement = AccountStatement::query()
            ->when($clientId, fn ($query) => $query->where('client_id', $clientId))
            ->latest('occurred_at')
            ->get();

        return Inertia::render('Client/Dashboard', [
            'projects' => $projects->map(function (Project $project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status,
                    'event_date' => optional($project->event_date)?->toDateString(),
                    'gallery_token' => $project->gallery_token,
                    'public_photo_count' => $project->photos->where('show_on_website', true)->count(),
                    'photo_count' => $project->photos->count(),
                    'balance_due' => (float) $project->invoices->sum('balance_due'),
                    'invoices_count' => $project->invoices->count(),
                ];
            })->values(),
            'invoices' => $invoices->map(fn ($invoice) => [
                'id' => $invoice->id,
                'project_id' => $invoice->project_id,
                'invoice_number' => $invoice->invoice_number,
                'concept' => $invoice->concept,
                'status' => $invoice->status,
                'subtotal' => (float) $invoice->subtotal,
                'tax_amount' => (float) $invoice->tax_amount,
                'total' => (float) $invoice->total,
                'balance_due' => (float) $invoice->balance_due,
                'due_date' => optional($invoice->due_date)?->toDateString(),
                'itbms_enabled' => (bool) $invoice->itbms_enabled,
                'alanube_status' => $invoice->alanube_status,
            ])->values(),
            'summary' => [
                'projects' => $projects->count(),
                'open_balance' => (float) $invoices->sum('balance_due'),
                'paid_invoices' => $invoices->where('status', 'paid')->count(),
                'pending_invoices' => $invoices->where('status', '!=', 'paid')->count(),
            ],
            'statement' => $statement->map(fn ($entry) => [
                'id' => $entry->id,
                'entry_type' => $entry->entry_type,
                'description' => $entry->description,
                'reference' => $entry->reference,
                'amount' => (float) $entry->amount,
                'occurred_at' => optional($entry->occurred_at)?->toDateString(),
            ])->values(),
        ]);
    }
}
