<?php

namespace App\Modules\Leads\Events;

use App\Models\Lead;

class LeadStatusChanged
{
    public function __construct(
        public readonly Lead $lead,
        public readonly string $previousStatus,
        public readonly string $newStatus,
    ) {}
}
