<?php

namespace App\Modules\Automations\Actions;

use App\Models\AutomationRule;
use App\Services\CrmAutomationService;

class RunAutomationAction
{
    public function __construct(private readonly CrmAutomationService $automationService) {}

    public function execute(AutomationRule $rule): void
    {
        $this->automationService->runRule($rule);
    }
}
