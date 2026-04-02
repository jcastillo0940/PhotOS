<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'amount', 'status', 'due_date', 'concept', 'notes'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function project() { return $this->belongsTo(Project::class); }
}
