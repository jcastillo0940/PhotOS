<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'provider',
        'payment_mode',
        'plan_code',
        'billing_cycle',
        'status',
        'amount',
        'currency',
        'paypal_product_id',
        'paypal_plan_id',
        'paypal_subscription_id',
        'paypal_customer_id',
        'paypal_vault_token_id',
        'paypal_approval_url',
        'starts_at',
        'current_period_starts_at',
        'current_period_ends_at',
        'grace_ends_at',
        'suspended_at',
        'canceled_at',
        'auto_renew',
        'failed_payments_count',
        'manual_override_status',
        'manual_override_reason',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'auto_renew' => 'boolean',
        'metadata' => 'array',
        'starts_at' => 'datetime',
        'current_period_starts_at' => 'datetime',
        'current_period_ends_at' => 'datetime',
        'grace_ends_at' => 'datetime',
        'suspended_at' => 'datetime',
        'canceled_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function transactions()
    {
        return $this->hasMany(TenantSubscriptionTransaction::class);
    }
}