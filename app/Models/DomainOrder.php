<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DomainOrder extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'type',
        'provider',
        'domain_name',
        'status',
        'currency',
        'amount',
        'registrar_reference',
        'tenant_domain_id',
        'error_message',
        'notes',
        'verification_attempts',
        'last_checked_at',
        'next_check_at',
        'manual_state',
        'metadata',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'verification_attempts' => 'integer',
        'last_checked_at' => 'datetime',
        'next_check_at' => 'datetime',
        'metadata' => 'array',
        'completed_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function tenantDomain(): BelongsTo
    {
        return $this->belongsTo(TenantDomain::class);
    }
}
