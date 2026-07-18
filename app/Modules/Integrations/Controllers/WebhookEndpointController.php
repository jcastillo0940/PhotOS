<?php

namespace App\Modules\Integrations\Controllers;
use App\Http\Controllers\Controller;

use App\Models\WebhookDelivery;
use App\Models\WebhookEndpoint;
use App\Services\WebhookDispatchService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WebhookEndpointController extends Controller
{
    public function index()
    {
        $tenantId  = app(TenantContext::class)->id();
        $endpoints = WebhookEndpoint::where('tenant_id', $tenantId)
            ->latest()
            ->get()
            ->map(fn (WebhookEndpoint $ep) => [
                'id'                 => $ep->id,
                'name'               => $ep->name,
                'url'                => $ep->url,
                'secret'             => $ep->secret,
                'event_types'        => $ep->event_types,
                'is_active'          => $ep->is_active,
                'last_response_code' => $ep->last_response_code,
                'last_delivered_at'  => $ep->last_delivered_at?->toIso8601String(),
                'created_at'         => $ep->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Settings/Webhooks', [
            'endpoints'   => $endpoints,
            'eventTypes'  => WebhookDispatchService::EVENTS,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'url'         => 'required|url|max:500',
            'event_types' => 'nullable|array',
            'event_types.*' => 'string|in:' . implode(',', WebhookDispatchService::EVENTS),
        ]);

        $tenantId = app(TenantContext::class)->id();

        WebhookEndpoint::create([
            'tenant_id'   => $tenantId,
            'name'        => $data['name'],
            'url'         => $data['url'],
            'secret'      => Str::random(40),
            'event_types' => empty($data['event_types']) ? null : $data['event_types'],
            'is_active'   => true,
        ]);

        return back()->with('success', 'Webhook creado correctamente.');
    }

    public function update(Request $request, WebhookEndpoint $webhookEndpoint)
    {
        $this->authorizeTenant($webhookEndpoint);

        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'url'         => 'sometimes|url|max:500',
            'event_types' => 'nullable|array',
            'event_types.*' => 'string|in:' . implode(',', WebhookDispatchService::EVENTS),
            'is_active'   => 'sometimes|boolean',
        ]);

        if (isset($data['event_types'])) {
            $data['event_types'] = empty($data['event_types']) ? null : $data['event_types'];
        }

        $webhookEndpoint->update($data);

        return back()->with('success', 'Webhook actualizado.');
    }

    public function destroy(WebhookEndpoint $webhookEndpoint)
    {
        $this->authorizeTenant($webhookEndpoint);
        $webhookEndpoint->deliveries()->delete();
        $webhookEndpoint->delete();

        return back()->with('success', 'Webhook eliminado.');
    }

    public function regenerateSecret(WebhookEndpoint $webhookEndpoint)
    {
        $this->authorizeTenant($webhookEndpoint);
        $webhookEndpoint->update(['secret' => Str::random(40)]);

        return back()->with('success', 'Clave secreta regenerada.');
    }

    public function deliveries(WebhookEndpoint $webhookEndpoint)
    {
        $this->authorizeTenant($webhookEndpoint);

        $deliveries = $webhookEndpoint->deliveries()
            ->latest('created_at')
            ->limit(50)
            ->get()
            ->map(fn (WebhookDelivery $d) => [
                'id'            => $d->id,
                'event_type'    => $d->event_type,
                'delivery_id'   => $d->delivery_id,
                'status'        => $d->status,
                'response_code' => $d->response_code,
                'duration_ms'   => $d->duration_ms,
                'attempt'       => $d->attempt,
                'delivered_at'  => $d->delivered_at?->toIso8601String(),
                'created_at'    => $d->created_at?->toIso8601String(),
            ]);

        return response()->json(['deliveries' => $deliveries]);
    }

    private function authorizeTenant(WebhookEndpoint $endpoint): void
    {
        abort_unless($endpoint->tenant_id === app(TenantContext::class)->id(), 403);
    }
}
