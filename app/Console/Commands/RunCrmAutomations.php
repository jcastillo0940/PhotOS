<?php

namespace App\Console\Commands;

use App\Services\CrmAutomationService;
use Illuminate\Console\Command;

class RunCrmAutomations extends Command
{
    protected $signature = 'crm:run-automations';
    protected $description = 'Ejecuta automatizaciones programadas del CRM';

    public function handle(CrmAutomationService $automationService): int
    {
        $count = $automationService->runScheduled();
        $this->info("Automatizaciones ejecutadas: {$count}");

        return self::SUCCESS;
    }
}
