<?php

namespace App\Modules\Contracts\Listeners;

use App\Modules\Contracts\Events\ContractSigned;
use Illuminate\Support\Facades\Log;

class NotifyContractSigned
{
    public function handle(ContractSigned $event): void
    {
        Log::info('Contract signed', ['contract_id' => $event->contract->id]);
    }
}
