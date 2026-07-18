<?php

namespace App\Modules\MediaProcessing\Tests;

use App\Modules\MediaProcessing\Actions\RunFaceRecognitionAction;
use App\Modules\MediaProcessing\Actions\ConfirmIdentityAction;
use App\Modules\MediaProcessing\Events\FaceIdentityConfirmed;
use PHPUnit\Framework\TestCase;

class MediaProcessingActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(RunFaceRecognitionAction::class));
        $this->assertTrue(class_exists(ConfirmIdentityAction::class));
    }

    public function test_event_classes_exist(): void
    {
        $this->assertTrue(class_exists(FaceIdentityConfirmed::class));
    }
}
