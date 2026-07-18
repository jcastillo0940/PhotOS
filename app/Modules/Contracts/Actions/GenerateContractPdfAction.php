<?php

namespace App\Modules\Contracts\Actions;

use App\Models\Contract;
use Barryvdh\DomPDF\Facade\Pdf;

class GenerateContractPdfAction
{
    public function execute(Contract $contract): \Barryvdh\DomPDF\PDF
    {
        return Pdf::loadView('contracts.pdf', ['contract' => $contract]);
    }
}
