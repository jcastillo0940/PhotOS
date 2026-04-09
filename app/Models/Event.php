<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'project_id', 'title', 'description', 'start', 'end', 'type', 'status', 'payment_status', 'source',
        'client_name', 'client_email', 'client_phone', 'timezone', 'color', 'all_day'
    ];

    protected $casts = [
        'start' => 'datetime',
        'end' => 'datetime',
        'all_day' => 'boolean',
    ];

    public function project() { return $this->belongsTo(Project::class); }
}
