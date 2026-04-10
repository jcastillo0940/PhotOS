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
    : HasMany
    {
        return $this->hasMany(TenantDomain::class);
    }

    public function primaryDomain(): HasOne
    {
        return $this->hasOne(TenantDomain::class)->where('is_primary', true);
    }

    public function settings()
    : HasMany
    {
        return $this->hasMany(Setting::class);
    }

    public function users()
    : HasMany
    {
        return $this->hasMany(User::class);
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

    public function featureLimit(string $feature): mixed
    {
        return $this->plan?->featureValue($feature);
    }

    public function featureUsageCount(string $feature): int
    {
        $start = Carbon::now()->startOfMonth();

        return match ($feature) {
            'ai_scans' => FaceIdentity::withoutGlobalScope('tenant')
                ->where('tenant_id', $this->id)
                ->whereNotNull('created_at')
                ->where('created_at', '>=', $start)
                ->count(),
            'photo_uploads' => Photo::withoutGlobalScope('tenant')
                ->where('tenant_id', $this->id)
                ->whereNotNull('created_at')
                ->where('created_at', '>=', $start)
                ->count(),
            default => 0,
        };
    }

    public function canUseFeature(string $feature, int $increment = 1): bool
    {
        $limit = $this->featureLimit($feature);

        if ($limit === null) {
            return true;
        }

        if (is_bool($limit)) {
            return $limit;
        }

        if (!is_numeric($limit)) {
            return false;
        }

        return ($this->featureUsageCount($feature) + max(0, $increment)) <= (int) $limit;
    }
}
