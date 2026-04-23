<?php

namespace App\Jobs;

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
