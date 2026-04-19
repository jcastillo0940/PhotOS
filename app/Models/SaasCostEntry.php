<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaasCostEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'period_start',
        'provider',
        'service',
        'cost_type',
        'amount_usd',
        'source',
        'notes',
        'recorded_by_user_id',
    ];

    protected $casts = [
        'period_start' => 'date',
        'amount_usd' => 'decimal:4',
    ];

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }
}
