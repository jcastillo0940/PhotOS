<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WebhookEndpoint extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'url',
        'secret',
        'event_types',
        'is_active',
        'last_response_code',
        'last_delivered_at',
    ];

    protected $casts = [
        'event_types'       => 'array',
        'is_active'         => 'boolean',
        'last_delivered_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(WebhookDelivery::class);
    }

    public function listensTo(string $eventType): bool
    {
        return empty($this->event_types) || in_array($eventType, $this->event_types, true);
    }
}
