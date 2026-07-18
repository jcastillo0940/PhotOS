<?php

namespace App\Modules\Projects\Events;

use App\Models\Project;

class ProjectCreated
{
    public function __construct(public readonly Project $project) {}
}
