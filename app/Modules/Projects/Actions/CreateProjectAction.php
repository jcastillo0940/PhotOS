<?php

namespace App\Modules\Projects\Actions;

use App\Models\Project;
use App\Models\Tenant;
use App\Modules\Projects\Events\ProjectCreated;
use Illuminate\Support\Facades\Event;

class CreateProjectAction
{
    public function execute(array $data, Tenant $tenant): Project
    {
        $project = Project::create(array_merge($data, ['tenant_id' => $tenant->id]));
        Event::dispatch(new ProjectCreated($project));
        return $project;
    }
}
