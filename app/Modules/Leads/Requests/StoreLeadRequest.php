<?php

namespace App\Modules\Leads\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:255',
            'email'       => 'nullable|email|max:255',
            'phone'       => 'nullable|string|max:50',
            'source'      => 'nullable|string|max:100',
            'notes'       => 'nullable|string',
            'status'      => 'nullable|string',
            'metadata'    => 'nullable|array',
        ];
    }
}
