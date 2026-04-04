<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Support\DemoMediaSeeder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('demo:sync-r2-media')]
#[Description('Generates demo homepage and gallery images and uploads them to Cloudflare R2.')]
class SyncDemoMediaToR2 extends Command
{
    public function handle(DemoMediaSeeder $mediaSeeder): int
    {
        $this->info('Checking Cloudflare R2 connectivity...');

        if (! $mediaSeeder->canWriteToR2()) {
            $this->error('R2 is not reachable. Configure real credentials in settings before syncing demo media.');

            return self::FAILURE;
        }

        $this->info('Uploading homepage demo assets...');
        $mediaSeeder->syncHomepageImages();

        $map = [
            'demo-gallery-camila-diego-2026' => 'wedding',
            'demo-gallery-lucia-marin-2026' => 'portrait',
            'demo-gallery-atelier-verde-2026' => 'commercial',
        ];

        foreach ($map as $token => $theme) {
            $project = Project::where('gallery_token', $token)->first();

            if (! $project) {
                $this->warn("Project with gallery token [{$token}] not found. Skipping.");
                continue;
            }

            $this->info("Uploading {$theme} demo assets for project {$project->name}...");
            $mediaSeeder->syncProjectPhotos($project, $theme);
        }

        $this->info('Demo media uploaded to Cloudflare R2 successfully.');

        return self::SUCCESS;
    }
}
