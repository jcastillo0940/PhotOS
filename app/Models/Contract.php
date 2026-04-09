<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Contract extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'project_id', 'content', 'contract_data', 'status', 'signed_at', 'signature_data', 'token'
    ];

    protected $casts = [
        'signed_at' => 'datetime',
        'contract_data' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($contract) {
            if (blank($contract->token)) {
                $contract->token = Str::random(40);
            }
        });
    }

    public function project() { return $this->belongsTo(Project::class); }
}
