<?php

namespace App\Modules\Reports\Actions;

use App\Models\Lead;
use App\Models\Project;
use App\Models\Invoice;
use App\Support\Tenancy\TenantContext;

class GenerateDashboardDataAction
{
    public function __construct(private readonly TenantContext $tenantContext) {}

    public function execute(): array
    {
        $tenantId = $this->tenantContext->id();

        return [
            'projects_count' => Project::where('tenant_id', $tenantId)->count(),
            'leads_count'    => Lead::where('tenant_id', $tenantId)->count(),
            'invoices_total' => Invoice::where('tenant_id', $tenantId)->sum('total'),
        ];
    }
}
