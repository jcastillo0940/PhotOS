<?php

namespace App\Modules\MediaProcessing\Listeners;

use App\Modules\MediaProcessing\Events\FaceIdentityConfirmed;
use Illuminate\Support\Facades\Log;

class UpdatePhotoAfterRecognition
{
    public function handle(FaceIdentityConfirmed $event): void
    {
        Log::info('Face identity confirmed', ['identity_id' => $event->identity->id]);
    }
}
