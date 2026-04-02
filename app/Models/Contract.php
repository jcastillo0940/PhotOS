<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'content', 'status', 'signed_at', 'signature_data', 'token'
    ];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($contract) {
            $contract->token = Str::random(40);
        });
    }

    public function project() { return $this->belongsTo(Project::class); }
}
