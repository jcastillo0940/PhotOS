<?php

namespace App\Modules\MediaProcessing\Actions;

use App\Models\Project;
use App\Modules\MediaProcessing\Jobs\DispatchFaceRecognitionTaskJob;

class RunFaceRecognitionAction
{
    public function execute(Project $project): void
    {
        DispatchFaceRecognitionTaskJob::dispatch($project);
    }
}
