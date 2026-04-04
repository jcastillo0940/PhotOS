<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AutomationRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'is_active',
        'event_type',
        'trigger_type',
        'trigger_offset_days',
        'action_type',
        'action_config',
        'conditions',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'action_config' => 'array',
        'conditions' => 'array',
    ];

    public function runs()
    {
        return $this->hasMany(AutomationRun::class);
    }

    public function tasks()
    {
        return $this->hasMany(CrmTask::class);
    }
}
