<?php

namespace App\Modules\MediaProcessing\Events;

use App\Models\FaceIdentity;

class FaceIdentityConfirmed
{
    public function __construct(public readonly FaceIdentity $identity) {}
}
