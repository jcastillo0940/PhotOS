<?php

namespace App\Modules\Automations\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAutomationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'       => 'required|string|max:255',
            'trigger'    => 'required|string',
            'conditions' => 'nullable|array',
            'actions'    => 'required|array',
            'is_active'  => 'nullable|boolean',
        ];
    }
}
