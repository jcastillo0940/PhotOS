<?php

namespace App\Modules\Contracts\Actions;

use App\Models\Contract;
use App\Modules\Contracts\Events\ContractSigned;
use Illuminate\Support\Facades\Event;

class SignContractAction
{
    public function execute(Contract $contract, string $signatureData): Contract
    {
        $contract->update([
            'signed_at'      => now(),
            'signature_data' => $signatureData,
            'status'         => 'signed',
        ]);

        Event::dispatch(new ContractSigned($contract->fresh()));

        return $contract->fresh();
    }
}
