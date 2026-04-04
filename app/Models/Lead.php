<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'name',
        'email',
        'event_type',
        'tentative_date',
        'responses',
        'briefing_answers',
        'briefing_token',
        'briefing_sent_at',
        'briefing_completed_at',
        'nps_score',
        'nps_comment',
        'nps_token',
        'nps_sent_at',
        'nps_completed_at',
        'notes',
        'status',
        'last_active_at',
    ];

    protected $casts = [
        'responses' => 'array',
        'briefing_answers' => 'array',
        'tentative_date' => 'date',
        'briefing_sent_at' => 'datetime',
        'briefing_completed_at' => 'datetime',
        'nps_sent_at' => 'datetime',
        'nps_completed_at' => 'datetime',
        'last_active_at' => 'datetime',
    ];

    public function client() { return $this->belongsTo(Client::class); }
    public function project() { return $this->hasOne(Project::class); }
}
