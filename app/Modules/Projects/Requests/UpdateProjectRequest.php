<?php

namespace App\Modules\Projects\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => 'sometimes|string|max:255',
            'date'        => 'sometimes|nullable|date',
            'description' => 'sometimes|nullable|string',
            'client_id'   => 'sometimes|nullable|integer|exists:clients,id',
            'metadata'    => 'sometimes|nullable|array',
        ];
    }
}
