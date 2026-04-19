<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GeminiUsageRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'project_id',
        'photo_id',
        'request_id',
        'model',
        'prompt_tokens',
        'candidate_tokens',
        'total_tokens',
        'input_cost_usd',
        'output_cost_usd',
        'total_cost_usd',
        'is_estimated',
        'metadata',
    ];

    protected $casts = [
        'prompt_tokens' => 'integer',
        'candidate_tokens' => 'integer',
        'total_tokens' => 'integer',
        'input_cost_usd' => 'decimal:6',
        'output_cost_usd' => 'decimal:6',
        'total_cost_usd' => 'decimal:6',
        'is_estimated' => 'boolean',
        'metadata' => 'array',
    ];
}
