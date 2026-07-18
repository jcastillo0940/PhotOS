<?php

namespace App\Modules\Domains\Events;

use App\Models\TenantDomain;

class DomainConnected
{
    public function __construct(public readonly TenantDomain $domain) {}
}
