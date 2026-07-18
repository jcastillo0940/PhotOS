<?php

namespace App\Modules\Projects\Events;

use App\Models\Project;

class ProjectDeleted
{
    public function __construct(
        public readonly int $projectId,
        public readonly int $tenantId,
    ) {}
}
