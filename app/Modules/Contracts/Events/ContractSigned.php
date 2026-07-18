<?php

namespace App\Modules\Contracts\Events;

use App\Models\Contract;

class ContractSigned
{
    public function __construct(public readonly Contract $contract) {}
}
