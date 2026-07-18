<?php

namespace App\Modules\Automations\Events;

use App\Models\AutomationRule;

class AutomationTriggered
{
    public function __construct(
        public readonly AutomationRule $rule,
        public readonly string $trigger,
        public readonly mixed $subject,
    ) {}
}
