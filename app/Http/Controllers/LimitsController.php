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
        $currentPlan = $tenant?->planDefinition() ?? [];
        $features = $currentPlan['features'] ?? [];

        return Inertia::render('Admin/Limits/Index', [
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'plan_code' => $tenant->plan_code,
                'status' => $tenant->status,
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
        ]);
    }
}
