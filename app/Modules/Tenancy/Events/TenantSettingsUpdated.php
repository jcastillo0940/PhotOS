<?php

namespace App\Modules\Tenancy\Events;

use App\Models\Tenant;

class TenantSettingsUpdated
{
    public function __construct(
        public readonly Tenant $tenant,
        public readonly string $section,
    ) {}
}
