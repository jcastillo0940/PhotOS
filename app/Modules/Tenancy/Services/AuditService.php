<?php

namespace App\Modules\Tenancy\Services;

use App\Models\AuditLog;
use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Model;

class AuditService
{
    public function log(
        string $event,
        array $properties = [],
        ?Model $subject = null,
        ?string $subjectLabel = null,
    ): void {
        try {
            $request = request();
            $context = app(TenantContext::class);
            $user    = $request->user();
            $tenant  = $context->tenant();

            AuditLog::create([
                'tenant_id'     => $tenant?->id,
                'user_id'       => $user?->id,
                'user_name'     => $user?->name ?? '',
                'user_email'    => $user?->email ?? '',
                'event'         => $event,
                'subject_type'  => $subject ? class_basename($subject) : null,
                'subject_id'    => $subject?->id,
                'subject_label' => $subjectLabel ?? $subject?->name ?? null,
                'properties'    => $properties ?: null,
                'ip_address'    => $request->ip(),
            ]);
        } catch (\Throwable) {
            // Audit logging must never break the main flow.
        }
    }

    public function logAs(
        string $event,
        array $actorSnapshot,
        ?int $tenantId = null,
        array $properties = [],
        ?Model $subject = null,
        ?string $subjectLabel = null,
    ): void {
        try {
            AuditLog::create([
                'tenant_id'     => $tenantId,
                'user_id'       => $actorSnapshot['id'] ?? null,
                'user_name'     => $actorSnapshot['name'] ?? '',
                'user_email'    => $actorSnapshot['email'] ?? '',
                'event'         => $event,
                'subject_type'  => $subject ? class_basename($subject) : null,
                'subject_id'    => $subject?->id,
                'subject_label' => $subjectLabel ?? $subject?->name ?? null,
                'properties'    => $properties ?: null,
                'ip_address'    => request()->ip(),
            ]);
        } catch (\Throwable) {
            //
        }
    }
}
