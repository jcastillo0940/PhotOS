<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'status',
        'plan_code',
        'billing_email',
        'storage_limit_bytes',
        'ai_enabled',
        'custom_domain_enabled',
        'metadata',
    ];

    protected $casts = [
        'storage_limit_bytes' => 'integer',
        'ai_enabled' => 'boolean',
        'custom_domain_enabled' => 'boolean',
        'metadata' => 'array',
    ];

    public function domains()
    {
        return $this->hasMany(TenantDomain::class);
    }

    public function primaryDomain()
    {
        return $this->hasOne(TenantDomain::class)->where('is_primary', true);
    }

    public function settings()
    {
        return $this->hasMany(Setting::class);
    }
}
