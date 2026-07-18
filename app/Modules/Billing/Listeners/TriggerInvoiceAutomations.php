<?php

namespace App\Modules\Billing\Listeners;

use App\Modules\Billing\Events\InvoiceCreated;
use App\Modules\Leads\Services\CrmAutomationService;

class TriggerInvoiceAutomations
{
    public function __construct(private readonly CrmAutomationService $automationService) {}

    public function handle(InvoiceCreated $event): void
    {
        $this->automationService->triggerForInvoice($event->invoice, 'invoice_created');
    }
}
