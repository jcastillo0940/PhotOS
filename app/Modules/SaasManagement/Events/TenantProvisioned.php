<?php

namespace App\Modules\SaasManagement\Events;

use App\Models\Tenant;

class TenantProvisioned
{
    public function __construct(public readonly Tenant $tenant) {}
}
