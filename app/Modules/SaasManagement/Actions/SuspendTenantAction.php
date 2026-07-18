<?php

namespace App\Modules\SaasManagement\Actions;

use App\Models\Tenant;
use App\Modules\SaasManagement\Events\TenantSuspended;
use Illuminate\Support\Facades\Event;

class SuspendTenantAction
{
    public function execute(Tenant $tenant, string $reason): Tenant
    {
        $tenant->update(['status' => 'suspended']);
        Event::dispatch(new TenantSuspended($tenant->fresh(), $reason));
        return $tenant->fresh();
    }
}
