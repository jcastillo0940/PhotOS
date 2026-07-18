<?php

namespace App\Modules\Billing\Actions;

use App\Models\Tenant;
use App\Modules\Billing\Services\TenantBillingService;

class ApplyDiscountAction
{
    public function __construct(private readonly TenantBillingService $billingService) {}

    public function execute(Tenant $tenant, array $discountData): void
    {
        $this->billingService->applyDiscount($tenant, $discountData);
    }
}
