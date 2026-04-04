<?php

namespace App\Models;

use App\Support\GalleryTemplate;
use App\Support\InstallationPlan;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id', 'owner_user_id', 'name', 'status', 'event_date', 'location', 'package_details', 'roadmap',
        'gallery_token', 'gallery_password', 'download_limit', 'weekly_download_limit', 'downloads_used_in_window',
        'downloads_window_started_at', 'extra_download_quota', 'retention_days', 'storage_limit_bytes',
        'is_full_gallery_purchased', 'full_gallery_price', 'originals_expires_at',
        'hero_photo_id', 'hero_focus_x', 'hero_focus_y', 'gallery_template_code',
        'website_category', 'website_description',
    ];

    protected $casts = [
        'package_details' => 'array',
        'roadmap' => 'array',
        'event_date' => 'date',
        'downloads_window_started_at' => 'datetime',
        'originals_expires_at' => 'datetime',
        'storage_limit_bytes' => 'integer',
        'weekly_download_limit' => 'integer',
        'downloads_used_in_window' => 'integer',
        'extra_download_quota' => 'integer',
        'retention_days' => 'integer',
        'is_full_gallery_purchased' => 'boolean',
    ];

    public function lead() { return $this->belongsTo(Lead::class); }
    public function owner() { return $this->belongsTo(User::class, 'owner_user_id'); }
    public function contract() { return $this->hasOne(Contract::class); }
    public function invoices() { return $this->hasMany(Invoice::class); }
    public function photos() { return $this->hasMany(Photo::class)->orderBy('order_index'); }
    public function heroPhoto() { return $this->belongsTo(Photo::class, 'hero_photo_id'); }
    public function purchases() { return $this->hasMany(Purchase::class); }
    public function downloadLogs() { return $this->hasMany(DownloadLog::class); }

    public function planDefinition(): array
    {
        return InstallationPlan::current();
    }

    public function planName(): string
    {
        return $this->planDefinition()['name'] ?? 'Plan';
    }

    public function originalsBucketPrefix(): string
    {
        return $this->id.'/originals';
    }

    public function webBucketPrefix(): string
    {
        return $this->id.'/web';
    }

    public function effectiveWeeklyDownloadLimit(): ?int
    {
        if ($this->is_full_gallery_purchased) {
            return null;
        }

        $baseLimit = $this->weekly_download_limit ?? ($this->planDefinition()['weekly_download_limit'] ?? null);
        if ($baseLimit === null) {
            return null;
        }

        return $baseLimit + max(0, (int) $this->extra_download_quota);
    }

    public function syncDownloadWindow(): void
    {
        if (!$this->downloads_window_started_at || $this->downloads_window_started_at->diffInDays(now()) >= 7) {
            $this->forceFill([
                'downloads_window_started_at' => now(),
                'downloads_used_in_window' => 0,
            ])->save();
        }
    }

    public function remainingWeeklyDownloads(): ?int
    {
        $limit = $this->effectiveWeeklyDownloadLimit();

        if ($limit === null) {
            return null;
        }

        return max(0, $limit - $this->downloads_used_in_window);
    }

    public function hasWeeklyDownloadCapacity(): bool
    {
        $remaining = $this->remainingWeeklyDownloads();

        return $remaining === null || $remaining > 0;
    }

    public function originalsExpired(): bool
    {
        return $this->originals_expires_at !== null && now()->greaterThan($this->originals_expires_at);
    }

    public function highResAvailable(): bool
    {
        return !$this->originalsExpired() && $this->photos()->whereNotNull('original_path')->exists();
    }

    public function originalsUsageBytes(): int
    {
        return (int) $this->photos()->sum('original_bytes');
    }

    public function resolvedGalleryTemplate(): array
    {
        $selectedCode = $this->gallery_template_code ?: GalleryTemplate::defaultCode();

        if (!GalleryTemplate::isAllowedForPlan($selectedCode, $this->planDefinition())) {
            return GalleryTemplate::resolve(GalleryTemplate::firstAllowedCode($this->planDefinition()));
        }

        return GalleryTemplate::resolve($selectedCode);
    }
}
