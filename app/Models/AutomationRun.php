<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AutomationRun extends Model
{
    use HasFactory;

    protected $fillable = [
        'automation_rule_id',
        'lead_id',
        'project_id',
        'invoice_id',
        'trigger_type',
        'run_key',
        'status',
        'message',
        'payload',
        'executed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'executed_at' => 'datetime',
    ];

    public function rule()
    {
        return $this->belongsTo(AutomationRule::class, 'automation_rule_id');
    }
}
