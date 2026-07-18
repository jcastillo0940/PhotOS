<?php

namespace App\Modules\Domains\Listeners;

use App\Modules\Domains\Events\DomainConnected;
use Illuminate\Support\Facades\Log;

class SyncDnsAfterDomainConnected
{
    public function handle(DomainConnected $event): void
    {
        Log::info('Domain connected', ['domain' => $event->domain->hostname]);
    }
}
