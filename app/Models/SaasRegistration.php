<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaasRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'studio_name',
        'slug',
        'owner_name',
        'owner_email',
        'owner_phone',
        'plan_code',
        'billing_cycle',
        'payment_gateway',
        'status',
        'requested_domain',
        'provisioned_hostname',
        'tenant_id',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}