<?php

namespace App\Modules\Contracts\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'      => 'required|string|max:255',
            'body'       => 'required|string',
            'project_id' => 'required|integer|exists:projects,id',
            'client_id'  => 'nullable|integer|exists:clients,id',
        ];
    }
}
