<?php

namespace App\Modules\Notifications\Actions;

use App\Models\User;
use Illuminate\Notifications\Notification;

class SendNotificationAction
{
    public function execute(User $user, Notification $notification): void
    {
        $user->notify($notification);
    }
}
