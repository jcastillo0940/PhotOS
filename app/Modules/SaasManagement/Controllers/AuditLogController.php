<?php

namespace App\Modules\SaasManagement\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = AuditLog::with('tenant:id,name')
            ->when($request->tenant_id, fn ($q, $v) => $q->where('tenant_id', $v))
            ->when($request->event, fn ($q, $v) => $q->where('event', $v))
            ->when($request->search, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $q->where('user_email', 'like', "%{$v}%")
                  ->orWhere('user_name', 'like', "%{$v}%")
                  ->orWhere('subject_label', 'like', "%{$v}%");
            }))
            ->latest('created_at')
            ->paginate(40)
            ->through(fn (AuditLog $log) => [
                'id'            => $log->id,
                'tenant_id'     => $log->tenant_id,
                'tenant_name'   => $log->tenant?->name ?? 'SaaS',
                'event'         => $log->event,
                'event_label'   => $log->eventLabel(),
                'event_color'   => $log->eventColor(),
                'user_name'     => $log->user_name,
                'user_email'    => $log->user_email,
                'subject_label' => $log->subject_label,
                'properties'    => $log->properties,
                'ip_address'    => $log->ip_address,
                'created_at'    => $log->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Saas/AuditLog/Index', [
            'logs'       => $logs,
            'tenants'    => Tenant::orderBy('name')->get(['id', 'name']),
            'eventTypes' => AuditLog::distinct('event')->pluck('event')->sort()->values(),
            'filters'    => $request->only('tenant_id', 'event', 'search'),
        ]);
    }
}
