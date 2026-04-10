<?php

namespace App\Jobs;

use App\Models\FaceIdentity;
use App\Models\Photo;
use App\Models\Project;
use App\Models\Tenant;
use App\Services\FaceRecognitionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DispatchFaceRecognitionTaskJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $taskType,
        public ?int $projectId = null,
        public ?int $photoId = null,
        public ?int $faceIdentityId = null,
    ) {
    }

    public function handle(FaceRecognitionService $service): void
    {
        if ($this->taskType === 'extract_identity') {
            $identity = FaceIdentity::withoutGlobalScope('tenant')->findOrFail($this->faceIdentityId);
            $project = $this->projectId
                ? Project::withoutGlobalScope('tenant')->find($this->projectId)
                : ($identity->project_id ? Project::withoutGlobalScope('tenant')->find($identity->project_id) : null);

            // Configure R2 root for queue context (no HTTP middleware runs here)
            $tenantId = $identity->tenant_id ?? $project?->tenant_id;
            $this->configureR2RootForTenant($tenantId);

            $service->enqueueIdentityExtraction($project, $identity);
            return;
        }

        $project = Project::withoutGlobalScope('tenant')->findOrFail($this->projectId);
        $photo = Photo::withoutGlobalScope('tenant')->findOrFail($this->photoId);

        // Configure R2 root for queue context
        $this->configureR2RootForTenant($project->tenant_id);

        $service->enqueuePhotoRecognition($project, $photo);
    }

    private function configureR2RootForTenant(?int $tenantId): void
    {
        if (!$tenantId) {
            return;
        }

        $tenant = Tenant::withoutGlobalScope('tenant')->find($tenantId);
        if ($tenant?->slug) {
            config(['filesystems.disks.r2.root' => "tenants/{$tenant->slug}"]);
            \Illuminate\Support\Facades\Storage::forgetDisk('r2');
        }
    }
}

