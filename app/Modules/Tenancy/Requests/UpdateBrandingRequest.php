<?php

namespace App\Modules\Tenancy\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBrandingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'app_name'    => 'sometimes|string|max:100',
            'app_tagline' => 'sometimes|nullable|string|max:200',
            'app_logo'    => 'sometimes|nullable|image|max:2048',
            'app_favicon' => 'sometimes|nullable|image|max:512',
        ];
    }
}
