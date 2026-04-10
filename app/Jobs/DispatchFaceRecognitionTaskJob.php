<?php

namespace App\Jobs;

use App\Models\FaceIdentity;
use App\Models\Photo;
use App\Models\Project;
use App\Services\FaceRecognitionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DispatchFaceRecognitionTaskJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $taskType,
        public ?int $projectId = null,
        public ?int $photoId = null,
        public ?int $faceIdentityId = null,
    ) {
    }

    public function handle(FaceRecognitionService $service): void
    {
        if ($this->taskType === 'extract_identity') {
            $identity = FaceIdentity::withoutGlobalScope('tenant')->findOrFail($this->faceIdentityId);
            $project = $this->projectId
                ? Project::withoutGlobalScope('tenant')->find($this->projectId)
                : ($identity->project_id ? Project::withoutGlobalScope('tenant')->find($identity->project_id) : null);

            $service->enqueueIdentityExtraction($project, $identity);
            return;
        }

        $project = Project::withoutGlobalScope('tenant')->findOrFail($this->projectId);
        $photo = Photo::withoutGlobalScope('tenant')->findOrFail($this->photoId);

        $service->enqueuePhotoRecognition($project, $photo);
    }
}
