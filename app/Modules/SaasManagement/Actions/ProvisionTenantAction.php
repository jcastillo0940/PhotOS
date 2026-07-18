<?php

namespace App\Modules\SaasManagement\Actions;

use App\Models\Tenant;
use App\Modules\SaasManagement\Events\TenantProvisioned;
use App\Modules\SaasManagement\Services\DomainProvisioningService;
use Illuminate\Support\Facades\Event;

class ProvisionTenantAction
{
    public function __construct(private readonly DomainProvisioningService $provisioningService) {}

    public function execute(Tenant $tenant, string $domain): Tenant
    {
        $this->provisioningService->connectExistingDomain($tenant, $domain);
        Event::dispatch(new TenantProvisioned($tenant->fresh()));
        return $tenant->fresh();
    }
}
