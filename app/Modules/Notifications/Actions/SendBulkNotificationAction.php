<?php

namespace App\Modules\Notifications\Actions;

use Illuminate\Support\Collection;
use Illuminate\Notifications\Notification;

class SendBulkNotificationAction
{
    public function execute(Collection $users, Notification $notification): void
    {
        $users->each(fn ($user) => $user->notify($notification));
    }
}
