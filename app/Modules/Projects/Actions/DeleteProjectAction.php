<?php

namespace App\Modules\Projects\Actions;

use App\Models\Project;
use App\Modules\Projects\Events\ProjectDeleted;
use App\Modules\Projects\Jobs\DeleteProjectJob;
use Illuminate\Support\Facades\Event;

class DeleteProjectAction
{
    public function execute(Project $project): void
    {
        $projectId = $project->id;
        $tenantId  = $project->tenant_id;

        DeleteProjectJob::dispatch($project);
        Event::dispatch(new ProjectDeleted($projectId, $tenantId));
    }
}
