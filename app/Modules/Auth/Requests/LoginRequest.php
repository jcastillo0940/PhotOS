<?php

namespace App\Modules\Auth\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'    => 'required|string|max:255',
            'password' => 'required|string|max:255',
            'remember' => 'nullable|boolean',
            '_surface' => 'nullable|string|in:studio,client,saas,web',
        ];
    }
}
