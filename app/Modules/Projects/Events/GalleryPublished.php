<?php

namespace App\Modules\Projects\Events;

use App\Models\Project;

class GalleryPublished
{
    public function __construct(public readonly Project $project) {}
}
