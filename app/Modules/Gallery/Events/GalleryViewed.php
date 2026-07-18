<?php

namespace App\Modules\Gallery\Events;

use App\Models\Project;

class GalleryViewed
{
    public function __construct(
        public readonly Project $project,
        public readonly string $visitorToken,
    ) {}
}
