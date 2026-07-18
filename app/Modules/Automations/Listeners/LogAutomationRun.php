<?php

namespace App\Modules\Automations\Listeners;

use App\Models\AutomationRun;
use App\Modules\Automations\Events\AutomationTriggered;

class LogAutomationRun
{
    public function handle(AutomationTriggered $event): void
    {
        AutomationRun::create([
            'automation_rule_id' => $event->rule->id,
            'trigger'            => $event->trigger,
            'subject_type'       => get_class($event->subject),
            'subject_id'         => $event->subject?->id,
            'triggered_at'       => now(),
        ]);
    }
}
