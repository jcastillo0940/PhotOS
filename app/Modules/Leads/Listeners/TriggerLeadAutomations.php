<?php

namespace App\Modules\Leads\Listeners;

use App\Modules\Leads\Events\LeadCreated;
use App\Modules\Leads\Services\CrmAutomationService;

class TriggerLeadAutomations
{
    public function __construct(private readonly CrmAutomationService $automationService) {}

    public function handle(LeadCreated $event): void
    {
        $this->automationService->triggerForLead($event->lead, 'lead_created');
    }
}
