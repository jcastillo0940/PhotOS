<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'invoice_number' => $this->invoice_number,
            'concept'        => $this->concept,
            'status'         => $this->status,
            'subtotal'       => $this->subtotal,
            'tax_rate'       => $this->tax_rate,
            'tax_amount'     => $this->tax_amount,
            'total'          => $this->total,
            'balance_due'    => $this->balance_due,
            'due_date'       => $this->due_date?->toDateString(),
            'project'        => $this->whenLoaded('project', fn () => [
                'id'   => $this->project->id,
                'name' => $this->project->name,
            ]),
            'client'         => $this->whenLoaded('client', fn () => [
                'id'        => $this->client->id,
                'full_name' => $this->client->full_name,
                'email'     => $this->client->email,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
