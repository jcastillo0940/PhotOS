<?php

namespace App\Models;

use App\Support\SaasPlanCatalog;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

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
        'custom_domain',
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

    public function planDefinition(): array
    {
        return $this->plan
            ? $this->plan->resolvedDefinition()
            : SaasPlanCatalog::for($this->plan_code, []);
    }

    public function featureLimit(string $feature): mixed
    {
        $features = $this->planDefinition()['features'] ?? [];

        return data_get($features, $feature);
    }

    public function syncUsageLimits(): void
    {
        if (! $this->ai_scans_reset_at || $this->ai_scans_reset_at->isPast()) {
            $this->update([
                'ai_scans_monthly_count' => 0,
                'ai_scans_reset_at' => now()->addDays(30),
            ]);
        }
    }

    public function canUseFeature(string $feature, int $amount = 1): bool
    {
        $amount = max(1, $amount);

        return match ($feature) {
            'ai_scans', 'face_recognition' => $this->supportsFaceRecognition() && $this->remainingPhotoProcessingQuota() >= $amount,
            'sponsor_detection' => $this->supportsSponsorDetection(),
            'photo_uploads' => ! $this->isSystemBlocked(),
            default => $this->resolveGenericFeatureAccess($feature, $amount),
        };
    }

    public function supportsAi(): bool
    {
        return $this->supportsFaceRecognition() || $this->supportsSponsorDetection();
    }

    public function supportsFaceRecognition(): bool
    {
        return $this->ai_enabled && (bool) $this->featureLimit('ai_face_recognition');
    }

    public function supportsSponsorDetection(): bool
    {
        return $this->ai_enabled && (bool) $this->featureLimit('ai_sponsor_detection');
    }

    public function maxSelectableSponsors(): ?int
    {
        $limit = $this->featureLimit('sponsor_selection_limit');

        return $limit === null ? null : (int) $limit;
    }

    public function requiresExplicitSponsors(): bool
    {
        return (bool) $this->featureLimit('requires_explicit_sponsors');
    }

    public function photosPerMonthLimit(): ?int
    {
        $limit = $this->featureLimit('photos_per_month') ?? $this->featureLimit('ai_scans_monthly');

        return $limit === null ? null : (int) $limit;
    }

    public function remainingPhotoProcessingQuota(): int
    {
        $this->syncUsageLimits();
        $limit = $this->photosPerMonthLimit();

        if ($limit === null) {
            return PHP_INT_MAX;
        }

        return max(0, $limit - (int) $this->ai_scans_monthly_count);
    }

    public function canConsumeScan(int $count = 1): bool
    {
        return $this->remainingPhotoProcessingQuota() >= max(1, $count);
    }

    public function incrementScanCount(int $count = 1): void
    {
        $this->increment('ai_scans_monthly_count', max(1, $count));
    }

    public function isInGracePeriod(): bool
    {
        return $this->status === 'grace_period' && $this->grace_period_ends_at && $this->grace_period_ends_at->isFuture();
    }

    public function isSystemBlocked(): bool
    {
        if (in_array($this->status, ['blocked', 'suspended'], true)) {
            return true;
        }

        if ($this->status === 'grace_period') {
            return true;
        }

        return false;
    }

    public function calculateCurrentStorageUsage(): int
    {
        return (int) Photo::withoutGlobalScope('tenant')
            ->where('tenant_id', $this->id)
            ->sum(DB::raw('COALESCE(optimized_bytes, 0) + COALESCE(original_bytes, 0)'));
    }

    public function calculateOriginalStorageUsage(): int
    {
        return (int) Photo::withoutGlobalScope('tenant')
            ->where('tenant_id', $this->id)
            ->sum(DB::raw('COALESCE(original_bytes, 0)'));
    }

    public function storageLimitBytes(): ?int
    {
        $limitGb = $this->featureLimit('storage_gb');
        if ($limitGb === null) {
            return null;
        }

        return (int) $limitGb * 1024 * 1024 * 1024;
    }

    public function hasStorageCapacityFor(int $incomingBytes): bool
    {
        $limit = $this->storageLimitBytes();
        if ($limit === null) {
            return true;
        }

        return ($this->calculateCurrentStorageUsage() + max(0, $incomingBytes)) <= $limit;
    }

    public function isStorageNearLimit(float $threshold = 0.9): bool
    {
        $limit = $this->storageLimitBytes();
        if (! $limit || $limit <= 0) {
            return false;
        }

        return $this->calculateCurrentStorageUsage() >= ($limit * $threshold);
    }

    private function resolveGenericFeatureAccess(string $feature, int $amount): bool
    {
        $limit = $this->featureLimit($feature);

        if ($limit === null) {
            return true;
        }

        if (is_bool($limit)) {
            return $limit;
        }

        if (is_numeric($limit)) {
            return (int) $limit >= $amount;
        }

        return filled($limit);
    }
}
