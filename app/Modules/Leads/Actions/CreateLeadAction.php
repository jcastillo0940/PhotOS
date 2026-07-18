<?php

namespace App\Modules\Leads\Actions;

use App\Models\Lead;
use App\Models\Tenant;
use App\Modules\Leads\Events\LeadCreated;
use Illuminate\Support\Facades\Event;

class CreateLeadAction
{
    public function execute(array $data, Tenant $tenant): Lead
    {
        $lead = Lead::create(array_merge($data, ['tenant_id' => $tenant->id]));
        Event::dispatch(new LeadCreated($lead));
        return $lead;
    }
}
