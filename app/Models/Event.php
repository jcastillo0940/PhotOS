<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'title', 'description', 'start', 'end', 'type', 'color', 'all_day'
    ];

    protected $casts = [
        'start' => 'datetime',
        'end' => 'datetime',
        'all_day' => 'boolean',
    ];

    public function project() { return $this->belongsTo(Project::class); }
}
