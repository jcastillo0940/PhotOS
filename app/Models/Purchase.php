<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'amount', 'status', 'gateway', 'type', 'payload'
    ];

    protected $casts = [
        'payload' => 'array',
        'amount' => 'decimal:2',
    ];

    public function project() { return $this->belongsTo(Project::class); }
}
