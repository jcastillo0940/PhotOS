<?php

namespace App\Modules\Integrations\Services;

use App\Jobs\DispatchWebhookJob;
use App\Models\Tenant;
use App\Models\WebhookEndpoint;

class WebhookDispatchService
{
    public const EVENTS = [
        'project.created',
        'invoice.created',
        'invoice.paid',
        'lead.created',
    ];

    public function fire(string $eventType, array $data, Tenant $tenant): void
    {
        WebhookEndpoint::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get()
            ->filter(fn (WebhookEndpoint $ep) => $ep->listensTo($eventType))
            ->each(fn (WebhookEndpoint $ep) => DispatchWebhookJob::dispatch($ep, $eventType, $data));
    }

    public static function projectPayload($project): array
    {
        return [
            'project_id'   => $project->id,
            'project_name' => $project->name,
            'status'       => $project->status,
            'event_date'   => $project->event_date?->toDateString(),
            'location'     => $project->location,
            'gallery_token' => $project->gallery_token,
            'client_name'  => $project->client?->full_name,
            'client_email' => $project->client?->email,
            'created_at'   => $project->created_at?->toIso8601String(),
        ];
    }

    public static function invoicePayload($invoice): array
    {
        return [
            'invoice_id'     => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'concept'        => $invoice->concept,
            'total'          => (float) $invoice->total,
            'balance_due'    => (float) $invoice->balance_due,
            'status'         => $invoice->status,
            'due_date'       => $invoice->due_date?->toDateString(),
            'project_id'     => $invoice->project_id,
            'project_name'   => $invoice->project?->name,
            'client_name'    => $invoice->client?->full_name,
            'client_email'   => $invoice->client?->email,
        ];
    }

    public static function leadPayload($lead): array
    {
        return [
            'lead_id'        => $lead->id,
            'name'           => $lead->name,
            'email'          => $lead->email,
            'event_type'     => $lead->event_type,
            'tentative_date' => $lead->tentative_date?->toDateString() ?? $lead->tentative_date,
            'status'         => $lead->status,
            'created_at'     => $lead->created_at?->toIso8601String(),
        ];
    }
}
