<?php

namespace App\Modules\Billing\Events;

use App\Models\Tenant;
use App\Models\TenantSubscription;

class SubscriptionActivated
{
    public function __construct(
        public readonly Tenant $tenant,
        public readonly TenantSubscription $subscription,
    ) {}
}
