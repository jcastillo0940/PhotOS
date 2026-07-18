<?php

namespace App\Modules\Billing\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'     => 'required|numeric|min:0.01',
            'method'     => 'required|string|max:100',
            'reference'  => 'nullable|string|max:255',
            'paid_at'    => 'nullable|date',
            'notes'      => 'nullable|string',
        ];
    }
}
