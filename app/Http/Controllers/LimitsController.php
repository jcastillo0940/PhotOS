<?php

namespace App\Http\Controllers;

use App\Support\Tenancy\TenantContext;
use Inertia\Inertia;

class LimitsController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
    ) {
    }

    public function index()
    {
        $tenant = $this->tenantContext->tenant();
        $tenant?->syncUsageLimits();
        $currentPlan = $tenant?->planDefinition() ?? [];
        $features = $currentPlan['features'] ?? [];
        $photosLimit = $features['photos_per_month'] ?? $features['ai_scans_monthly'] ?? null;
        $aiUsed = (int) ($tenant?->ai_scans_monthly_count ?? 0);
        $aiRemaining = $photosLimit === null ? null : max(0, (int) $photosLimit - $aiUsed);
        $storageUsedBytes = $tenant?->calculateCurrentStorageUsage() ?? 0;
        $storageLimitBytes = $tenant?->storageLimitBytes();

        return Inertia::render('Admin/Limits/Index', [
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'plan_code' => $tenant->plan_code,
                'status' => $tenant->status,
                'ai_scans_monthly_count' => $aiUsed,
                'ai_scans_reset_at' => optional($tenant->ai_scans_reset_at)?->toIso8601String(),
                'storage_used_bytes' => $storageUsedBytes,
                'storage_limit_bytes' => $storageLimitBytes,
            ] : null,
            'currentPlanCode' => $tenant?->plan_code,
            'currentPlan' => [
                'code' => $currentPlan['code'] ?? $tenant?->plan_code,
                'name' => $currentPlan['name'] ?? ucfirst((string) $tenant?->plan_code),
                'segment' => $currentPlan['segment'] ?? null,
                'price_monthly' => $currentPlan['price_monthly'] ?? null,
                'price_yearly' => $currentPlan['price_yearly'] ?? null,
                'features' => $features,
                'storage_limit_gb' => $features['storage_gb'] ?? null,
                'photos_per_month' => $features['photos_per_month'] ?? null,
                'ai_scans_monthly' => $features['ai_scans_monthly'] ?? null,
                'staff_limit' => $features['staff_limit'] ?? null,
                'allows_custom_domain' => $features['custom_domain'] ?? false,
                'ai_face_recognition' => $features['ai_face_recognition'] ?? false,
                'ai_sponsor_detection' => $features['ai_sponsor_detection'] ?? false,
                'sponsor_selection_limit' => $features['sponsor_selection_limit'] ?? null,
                'requires_explicit_sponsors' => $features['requires_explicit_sponsors'] ?? false,
            ],
            'usage' => [
                'ai_used' => $aiUsed,
                'ai_limit' => $photosLimit === null ? null : (int) $photosLimit,
                'ai_remaining' => $aiRemaining,
                'storage_used_bytes' => $storageUsedBytes,
                'storage_limit_bytes' => $storageLimitBytes,
                'storage_used_gb' => round($storageUsedBytes / 1073741824, 2),
                'storage_limit_gb' => $storageLimitBytes ? round($storageLimitBytes / 1073741824, 2) : null,
                'resets_at' => optional($tenant?->ai_scans_reset_at)?->toIso8601String(),
            ],
        ]);
    }
}
