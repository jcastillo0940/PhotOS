<?php

namespace App\Console\Commands;

use App\Models\Photo;
use App\Models\Project;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupExpiredOriginals extends Command
{
    protected $signature = 'gallery:cleanup-originals';

    protected $description = 'Delete expired original files from R2 without touching optimized web files.';

    public function handle(): int
    {
        $projects = Project::query()
            ->whereNotNull('originals_expires_at')
            ->where('originals_expires_at', '<=', now())
            ->get();

        foreach ($projects as $project) {
            Photo::query()
                ->where('project_id', $project->id)
                ->whereNotNull('original_path')
                ->get()
                ->each(function (Photo $photo) {
                    Storage::disk('r2')->delete($photo->original_path);
                    $photo->update(['original_path' => null, 'original_bytes' => null]);
                });
        }

        $this->info('Expired originals cleaned successfully.');

        return self::SUCCESS;
    }
}
