<?php

namespace App\Console\Commands;

use App\Modules\Projects\Jobs\ProcessUploadedPhotoJob;
use App\Models\Photo;
use Illuminate\Console\Command;

class RecoverStuckPhotosCommand extends Command
{
    protected $signature = 'photos:recover-stuck
                            {--minutes=10 : Minutes a photo must be stuck before recovery}
                            {--dry-run : Show what would be dispatched without actually dispatching}';

    protected $description = 'Re-dispatch processing jobs for photos stuck in queued/processing status';

    public function handle(): int
    {
        $minutes = (int) $this->option('minutes');
        $dryRun = $this->option('dry-run');
        $cutoff = now()->subMinutes($minutes);

        $stuck = Photo::withoutGlobalScope('tenant')
            ->whereIn('processing_status', ['queued', 'processing'])
            ->where('updated_at', '<=', $cutoff)
            ->with('project:id,tenant_id')
            ->get();

        if ($stuck->isEmpty()) {
            $this->line('No stuck photos found.');
            return 0;
        }

        $this->info("Found {$stuck->count()} stuck photo(s) (stuck > {$minutes} min).");

        foreach ($stuck as $photo) {
            $tenantId = $photo->project?->tenant_id;

            if ($dryRun) {
                $this->line("  [dry-run] Would re-dispatch photo ID {$photo->id} (status: {$photo->processing_status}, tenant: {$tenantId})");
                continue;
            }

            $photo->update([
                'processing_status' => 'queued',
                'processing_note'   => 'Re-encolado automáticamente por recovery.',
                'processing_started_at' => null,
            ]);

            ProcessUploadedPhotoJob::dispatch($photo->id, $tenantId);
            $this->line("  Re-dispatched photo ID {$photo->id} (tenant: {$tenantId})");
        }

        if (! $dryRun) {
            $this->info("Done. {$stuck->count()} job(s) re-dispatched.");
        }

        return 0;
    }
}
