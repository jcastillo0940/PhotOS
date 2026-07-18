<?php

namespace App\Modules\Tenancy\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $tenant = app(TenantContext::class)->tenant();
        $user   = $request->user();

        return response()->json([
            'tenant' => [
                'id'         => $tenant?->id,
                'name'       => $tenant?->name,
                'slug'       => $tenant?->slug,
                'plan_code'  => $tenant?->plan_code,
                'status'     => $tenant?->status,
            ],
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
            'usage' => [
                'projects_count'   => Project::count(),
                'projects_limit'   => $tenant?->featureLimit('projects_limit'),
                'storage_used_gb'  => $tenant ? round($tenant->calculateCurrentStorageUsage() / 1073741824, 3) : null,
                'storage_limit_gb' => $tenant?->featureLimit('storage_gb'),
                'ai_scans_used'    => $tenant?->ai_scans_monthly_count,
                'ai_scans_limit'   => $tenant?->aiScansMonthlyLimit(),
                'ai_scans_resets_at' => $tenant?->ai_scans_reset_at?->toIso8601String(),
            ],
        ]);
    }
}
