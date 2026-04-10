<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

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
        'ai_scans_monthly_count',
        'ai_scans_reset_at',
        'ai_enabled',
        'custom_domain_enabled',
        'grace_period_ends_at',
        'metadata',
    ];

    protected $casts = [
        'storage_limit_bytes' => 'integer',
        'ai_scans_monthly_count' => 'integer',
        'ai_scans_reset_at' => 'datetime',
        'ai_enabled' => 'boolean',
        'custom_domain_enabled' => 'boolean',
        'grace_period_ends_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function domains(): HasMany
    {
        return $this->hasMany(TenantDomain::class);
    }

    public function primaryDomain(): HasOne
    {
        return $this->hasOne(TenantDomain::class)->where('is_primary', true);
    }

    public function settings(): HasMany
    {
        return $this->hasMany(Setting::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function tenantUsers(): HasMany
    {
        return $this->hasMany(User::class)->withoutGlobalScope('tenant');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(TenantSubscription::class);
    }

    public function latestSubscription(): HasOne
    {
        return $this->hasOne(TenantSubscription::class)->latestOfMany();
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SaasPlan::class, 'plan_code', 'code');
    }

    /**
     * Resets the AI scan counter if 30 days have passed.
     */
    public function syncUsageLimits(): void
    {
        if (!$this->ai_scans_reset_at || $this->ai_scans_reset_at->isPast()) {
            $this->update([
                'ai_scans_monthly_count' => 0,
                'ai_scans_reset_at' => now()->addDays(30),
            ]);
        }
    }

    public function featureLimit(string $feature): mixed
    {
        return $this->plan?->featureValue($feature);
    }

    public function canConsumeScan(): bool
    {
        $this->syncUsageLimits();
        $limit = $this->featureLimit('ai_scans_monthly');

        if ($limit === null) return true; // Unlimited
        return $this->ai_scans_monthly_count < (int) $limit;
    }

    public function incrementScanCount(int $count = 1): void
    {
        $this->increment('ai_scans_monthly_count', $count);
    }

    public function isInGracePeriod(): bool
    {
        return $this->status === 'past_due' && $this->grace_period_ends_at && $this->grace_period_ends_at->isFuture();
    }

    public function isSystemBlocked(): bool
    {
        if ($this->status === 'blocked' || $this->status === 'suspended') return true;
        if ($this->status === 'past_due' && (!$this->grace_period_ends_at || $this->grace_period_ends_at->isPast())) return true;
        return false;
    }

    public function calculateCurrentStorageUsage(): int
    {
        return Photo::withoutGlobalScope('tenant')
            ->where('tenant_id', $this->id)
            ->sum(DB::raw('COALESCE(optimized_bytes, 0) + COALESCE(original_bytes, 0)'));
    }

    public function isStorageNearLimit(float $threshold = 0.9): bool
    {
        $limit = (int) $this->featureLimit('storage_gb') * 1024 * 1024 * 1024;
        if ($limit <= 0) return false;
        
        return $this->calculateCurrentStorageUsage() >= ($limit * $threshold);
    }
}
