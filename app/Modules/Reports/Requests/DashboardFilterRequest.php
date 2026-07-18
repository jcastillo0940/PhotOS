<?php

namespace App\Modules\Reports\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DashboardFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period'   => 'nullable|string|in:7d,30d,90d,365d,all',
            'from'     => 'nullable|date',
            'to'       => 'nullable|date|after_or_equal:from',
        ];
    }
}
