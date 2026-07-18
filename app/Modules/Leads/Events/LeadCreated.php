<?php

namespace App\Modules\Leads\Events;

use App\Models\Lead;

class LeadCreated
{
    public function __construct(public readonly Lead $lead) {}
}
