<?php

namespace App\Modules\Leads\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => 'sometimes|string|max:255',
            'email'    => 'sometimes|nullable|email|max:255',
            'phone'    => 'sometimes|nullable|string|max:50',
            'source'   => 'sometimes|nullable|string|max:100',
            'notes'    => 'sometimes|nullable|string',
            'status'   => 'sometimes|string',
            'metadata' => 'sometimes|nullable|array',
        ];
    }
}
