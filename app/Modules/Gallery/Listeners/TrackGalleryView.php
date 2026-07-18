<?php

namespace App\Modules\Gallery\Listeners;

use App\Modules\Gallery\Events\GalleryViewed;
use Illuminate\Support\Facades\Log;

class TrackGalleryView
{
    public function handle(GalleryViewed $event): void
    {
        Log::info('Gallery viewed', ['project_id' => $event->project->id]);
    }
}
