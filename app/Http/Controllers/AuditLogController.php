<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $tenant = app(TenantContext::class)->tenant();

        $logs = AuditLog::where('tenant_id', $tenant?->id)
            ->when($request->event, fn ($q, $v) => $q->where('event', $v))
            ->when($request->search, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $q->where('user_email', 'like', "%{$v}%")
                  ->orWhere('subject_label', 'like', "%{$v}%")
                  ->orWhere('user_name', 'like', "%{$v}%");
            }))
            ->latest('created_at')
            ->paginate(30)
            ->through(fn (AuditLog $log) => [
                'id'            => $log->id,
                'event'         => $log->event,
                'event_label'   => $log->eventLabel(),
                'event_color'   => $log->eventColor(),
                'user_name'     => $log->user_name,
                'user_email'    => $log->user_email,
                'subject_label' => $log->subject_label,
                'subject_type'  => $log->subject_type,
                'properties'    => $log->properties,
                'ip_address'    => $log->ip_address,
                'created_at'    => $log->created_at?->toIso8601String(),
            ]);

        $eventTypes = AuditLog::where('tenant_id', $tenant?->id)
            ->distinct('event')
            ->pluck('event')
            ->sort()
            ->values();

        return Inertia::render('Admin/AuditLog/Index', [
            'logs'        => $logs,
            'eventTypes'  => $eventTypes,
            'filters'     => $request->only('event', 'search'),
        ]);
    }
}
