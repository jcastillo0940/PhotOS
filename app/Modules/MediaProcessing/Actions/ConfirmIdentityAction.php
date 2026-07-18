<?php

namespace App\Modules\MediaProcessing\Actions;

use App\Models\FaceIdentity;
use App\Models\FaceUnknownDetection;
use App\Modules\MediaProcessing\Events\FaceIdentityConfirmed;
use Illuminate\Support\Facades\Event;

class ConfirmIdentityAction
{
    public function execute(FaceUnknownDetection $detection, FaceIdentity $identity): FaceIdentity
    {
        $detection->update([
            'confirmed_identity_id' => $identity->id,
            'confirmed_at'          => now(),
            'status'                => 'confirmed',
        ]);

        Event::dispatch(new FaceIdentityConfirmed($identity));

        return $identity;
    }
}
