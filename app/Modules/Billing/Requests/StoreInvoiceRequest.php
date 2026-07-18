<?php

namespace App\Modules\Billing\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'concept'    => 'required|string|max:500',
            'subtotal'   => 'required|numeric|min:0',
            'tax_rate'   => 'nullable|numeric|min:0|max:100',
            'due_date'   => 'nullable|date',
            'notes'      => 'nullable|string',
        ];
    }
}
