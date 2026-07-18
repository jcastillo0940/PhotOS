<?php

namespace App\Modules\Leads\Actions;

use App\Models\Lead;
use App\Modules\Leads\Events\LeadStatusChanged;
use Illuminate\Support\Facades\Event;

class UpdateLeadStatusAction
{
    public function execute(Lead $lead, string $newStatus): Lead
    {
        $previousStatus = $lead->status;
        $lead->update(['status' => $newStatus]);
        Event::dispatch(new LeadStatusChanged($lead->fresh(), $previousStatus, $newStatus));
        return $lead->fresh();
    }
}
