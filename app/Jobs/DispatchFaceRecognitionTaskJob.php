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
        public int $projectId,
        public ?int $photoId = null,
        public ?int $faceIdentityId = null,
    ) {
    }

    public function handle(FaceRecognitionService $service): void
    {
        $project = Project::withoutGlobalScope('tenant')->findOrFail($this->projectId);

        if ($this->taskType === 'extract_identity') {
            $identity = FaceIdentity::withoutGlobalScope('tenant')->findOrFail($this->faceIdentityId);
            $service->enqueueIdentityExtraction($project, $identity);
            return;
        }

        $photo = Photo::withoutGlobalScope('tenant')->findOrFail($this->photoId);
        $service->enqueuePhotoRecognition($project, $photo);
    }
}