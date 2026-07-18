<?php

namespace App\Modules\Gallery\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|max:255',
            'name'  => 'nullable|string|max:255',
        ];
    }
}
