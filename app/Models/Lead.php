<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'event_type',
        'tentative_date',
        'responses',
        'notes',
        'status',
        'last_active_at',
    ];

    protected $casts = [
        'responses' => 'array',
        'tentative_date' => 'date',
        'last_active_at' => 'datetime',
    ];
}
