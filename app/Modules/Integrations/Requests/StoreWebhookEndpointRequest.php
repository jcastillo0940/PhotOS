<?php

namespace App\Modules\Integrations\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWebhookEndpointRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'url'       => 'required|url|max:500',
            'events'    => 'required|array|min:1',
            'events.*'  => 'string',
            'is_active' => 'nullable|boolean',
        ];
    }
}
