<?php

namespace App\Modules\Billing\Actions;

use App\Models\Invoice;
use App\Models\Project;
use App\Modules\Billing\Events\InvoiceCreated;
use Illuminate\Support\Facades\Event;

class CreateInvoiceAction
{
    public function execute(Project $project, array $data): Invoice
    {
        $invoice = Invoice::create(array_merge($data, [
            'tenant_id'  => $project->tenant_id,
            'project_id' => $project->id,
        ]));

        Event::dispatch(new InvoiceCreated($invoice));

        return $invoice;
    }
}
