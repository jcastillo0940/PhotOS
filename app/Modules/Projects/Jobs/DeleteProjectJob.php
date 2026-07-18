<?php

namespace App\Modules\Projects\Jobs;

use App\Models\Project;
use App\Models\Tenant;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DeleteProjectJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;
    public int $timeout = 600;

    public function __construct(
        public readonly int $projectId,
        public readonly int $tenantId,
        public readonly array $photoData,      // [['optimized_path'=>..,'original_path'=>..,'thumbnail_url'=>..,'gemini_path'=>..], ...]
        public readonly array $identityPaths,  // ['path/to/face.jpg', ...]
    ) {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        $this->configureR2($this->tenantId);

        $r2 = Storage::disk('r2');
        $deleted = 0;

        foreach ($this->photoData as $photo) {
            foreach (['optimized_path', 'original_path', 'gemini_path'] as $field) {
                if (!empty($photo[$field])) {
                    $r2->delete($photo[$field]);
                    $deleted++;
                }
            }
            // thumbnail_url can be a relative path or a full URL (skip URLs)
            if (!empty($photo['thumbnail_url']) && !Str::startsWith($photo['thumbnail_url'], ['http://', 'https://'])) {
                $r2->delete($photo['thumbnail_url']);
                $deleted++;
            }
        }

        foreach ($this->identityPaths as $path) {
            if ($path) {
                $r2->delete($path);
                $deleted++;
            }
        }

        Log::info("DeleteProjectJob: project {$this->projectId} — {$deleted} R2 files removed.");
    }

    private function configureR2(int $tenantId): void
    {
        $tenant = Tenant::find($tenantId);
        if ($tenant?->slug) {
            config(['filesystems.disks.r2.root' => "tenants/{$tenant->slug}"]);
            Storage::forgetDisk('r2');
        }
    }
}
