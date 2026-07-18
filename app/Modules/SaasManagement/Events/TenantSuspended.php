<?php

namespace App\Modules\SaasManagement\Events;

use App\Models\Tenant;

class TenantSuspended
{
    public function __construct(
        public readonly Tenant $tenant,
        public readonly string $reason,
    ) {}
}
