<?php

namespace App\Modules\Projects\Listeners;

use App\Modules\Projects\Events\ProjectCreated;
use App\Modules\Leads\Services\CrmAutomationService;

class TriggerProjectAutomations
{
    public function __construct(private readonly CrmAutomationService $automationService) {}

    public function handle(ProjectCreated $event): void
    {
        $this->automationService->triggerForProject($event->project, 'project_created');
    }
}
