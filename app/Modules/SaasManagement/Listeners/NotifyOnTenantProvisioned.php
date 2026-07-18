<?php

namespace App\Modules\SaasManagement\Listeners;

use App\Modules\SaasManagement\Events\TenantProvisioned;
use Illuminate\Support\Facades\Log;

class NotifyOnTenantProvisioned
{
    public function handle(TenantProvisioned $event): void
    {
        Log::info('Tenant provisioned', ['tenant_id' => $event->tenant->id, 'slug' => $event->tenant->slug]);
    }
}
