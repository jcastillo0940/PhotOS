<?php

namespace App\Modules\Domains\Actions;

use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Modules\Domains\Events\DomainConnected;
use App\Modules\SaasManagement\Services\DomainProvisioningService;
use Illuminate\Support\Facades\Event;

class ConnectDomainAction
{
    public function __construct(private readonly DomainProvisioningService $provisioningService) {}

    public function execute(Tenant $tenant, string $domainName): TenantDomain
    {
        $domain = $this->provisioningService->connectExistingDomain($tenant, $domainName);
        Event::dispatch(new DomainConnected($domain));
        return $domain;
    }
}
