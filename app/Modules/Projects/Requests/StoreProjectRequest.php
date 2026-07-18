<?php

namespace App\Modules\Projects\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'         => 'required|string|max:255',
            'date'         => 'nullable|date',
            'description'  => 'nullable|string',
            'client_id'    => 'nullable|integer|exists:clients,id',
            'metadata'     => 'nullable|array',
        ];
    }
}
