<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookDelivery extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'webhook_endpoint_id',
        'tenant_id',
        'event_type',
        'delivery_id',
        'payload',
        'status',
        'response_code',
        'response_body',
        'duration_ms',
        'attempt',
        'delivered_at',
    ];

    protected $casts = [
        'payload'      => 'array',
        'delivered_at' => 'datetime',
        'created_at'   => 'datetime',
    ];

    public function endpoint(): BelongsTo
    {
        return $this->belongsTo(WebhookEndpoint::class, 'webhook_endpoint_id');
    }

    public function isSuccess(): bool
    {
        return $this->status === 'success';
    }
}
