<?php

namespace App\Modules\Projects\Actions;

use App\Models\Project;

class UpdateProjectSettingsAction
{
    public function execute(Project $project, array $settings): Project
    {
        $project->update($settings);
        return $project->fresh();
    }
}
