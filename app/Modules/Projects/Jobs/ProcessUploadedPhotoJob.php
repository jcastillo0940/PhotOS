<?php

namespace App\Modules\Projects\Jobs;

use App\Models\Tenant;
use App\Services\ProjectPhotoUploadService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ProcessUploadedPhotoJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [30, 120, 300];

    public function __construct(
        public int $photoId,
        public ?int $tenantId = null,
    ) {
        $this->onQueue('photos');
    }

    public function handle(ProjectPhotoUploadService $service): void
    {
        $this->configureR2RootForTenant($this->tenantId);

        // Verificar que la foto pertenece al tenant para el que se despachó este job.
        // Un mismatch indicaría un bug en el dispatch — se aborta para no escribir en el bucket incorrecto.
        if ($this->tenantId) {
            $photo = \App\Models\Photo::withoutGlobalScope('tenant')
                ->with('project:id,tenant_id')
                ->find($this->photoId);

            $actualTenantId = $photo?->project?->tenant_id ?? $photo?->tenant_id;

            if ($actualTenantId && (int) $actualTenantId !== (int) $this->tenantId) {
                \Illuminate\Support\Facades\Log::error('[ProcessUploadedPhotoJob] Tenant mismatch — job abortado', [
                    'photo_id'         => $this->photoId,
                    'job_tenant_id'    => $this->tenantId,
                    'actual_tenant_id' => $actualTenantId,
                ]);
                return;
            }
        }

        $service->processQueuedPhoto($this->photoId);
    }

    private function configureR2RootForTenant(?int $tenantId): void
    {
        if (! $tenantId) {
            return;
        }

        $tenant = Tenant::withoutGlobalScope('tenant')->find($tenantId);
        if ($tenant?->slug) {
            config(['filesystems.disks.r2.root' => "tenants/{$tenant->slug}"]);
            Storage::forgetDisk('r2');
        }
    }
}
