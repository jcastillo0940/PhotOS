<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Support\GalleryTemplate;
use App\Support\InstallationPlan;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'lead_id', 'client_id', 'owner_user_id', 'name', 'status', 'event_date', 'location', 'package_details', 'roadmap',
        'gallery_token', 'gallery_password', 'download_limit', 'weekly_download_limit', 'downloads_used_in_window',
        'downloads_window_started_at', 'extra_download_quota', 'retention_days', 'storage_limit_bytes',
        'is_full_gallery_purchased', 'full_gallery_price', 'originals_expires_at',
        'hero_photo_id', 'hero_focus_x', 'hero_focus_y', 'gallery_template_code',
        'website_category', 'website_description', 'face_recognition_enabled', 'selected_sponsors',
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
        'face_recognition_enabled' => 'boolean',
        'selected_sponsors' => 'array',
    ];

    public function lead() { return $this->belongsTo(Lead::class); }
    public function client() { return $this->belongsTo(Client::class); }
    public function owner() { return $this->belongsTo(User::class, 'owner_user_id'); }
    public function collaborators(): HasMany { return $this->hasMany(ProjectCollaborator::class)->withoutGlobalScope('tenant'); }
    public function contract() { return $this->hasOne(Contract::class); }
    public function invoices() { return $this->hasMany(Invoice::class); }
    public function photos() { return $this->hasMany(Photo::class)->orderBy('order_index'); }
    public function heroPhoto() { return $this->belongsTo(Photo::class, 'hero_photo_id'); }
    public function purchases() { return $this->hasMany(Purchase::class); }
    public function downloadLogs() { return $this->hasMany(DownloadLog::class); }
    public function faceIdentities() { return $this->hasMany(FaceIdentity::class); }
    public function galleryEmailRegistrations() { return $this->hasMany(GalleryEmailRegistration::class); }
    public function galleryFavorites() { return $this->hasMany(GalleryFavorite::class); }
    public function galleryFavoriteLogs() { return $this->hasMany(GalleryFavoriteLog::class); }
    public function accountStatements() { return $this->hasMany(AccountStatement::class); }
    public function crmTasks() { return $this->hasMany(CrmTask::class); }

    public function planDefinition(): array
    {
        $features = $this->tenant?->planDefinition()['features'] ?? [];

        return array_merge(InstallationPlan::current(), $features);
    }

    public function planName(): string
    {
        return $this->tenant?->planDefinition()['name']
            ?? $this->planDefinition()['name']
            ?? 'Plan';
    }

    public function originalsBucketPrefix(): string
    {
        return 'projects/'.$this->id.'/originals';
    }

    public function webBucketPrefix(): string
    {
        return 'projects/'.$this->id.'/web';
    }

    public function geminiBucketPrefix(): string
    {
        return 'projects/'.$this->id.'/ai';
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
        $selectedCode = $this->gallery_template_code ?: GalleryTemplate::defaultCode($this->tenant_id);

        if (!GalleryTemplate::isAllowedForPlan($selectedCode, $this->planDefinition())) {
            return GalleryTemplate::resolve(GalleryTemplate::firstAllowedCode($this->planDefinition()));
        }

        return GalleryTemplate::resolve($selectedCode);
    }

    public function selectedSponsors(): array
    {
        return collect($this->selected_sponsors ?? [])
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    public function supportsSponsorDetection(): bool
    {
        return (bool) $this->tenant?->supportsSponsorDetection();
    }

    public function sponsorSelectionLimit(): ?int
    {
        return $this->tenant?->maxSelectableSponsors();
    }

    public function requiresExplicitSponsors(): bool
    {
        return (bool) $this->tenant?->requiresExplicitSponsors();
    }

    public function hasSelectedSponsors(): bool
    {
        return count($this->selectedSponsors()) > 0;
    }

    public function userAccess(User $user): ?ProjectCollaborator
    {
        return $this->collaborators()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();
    }

    public function userCan(User $user, string $ability = 'view'): bool
    {
        if ($user->isDeveloper()) {
            return true;
        }

        $isTenantAdmin = in_array($user->role, ['owner', 'operator'], true) && (int) $user->tenant_id === (int) $this->tenant_id;

        if ($isTenantAdmin) {
            return $ability !== 'finance' || $user->isOwner();
        }

        $access = $this->userAccess($user);

        if (!$access) {
            return false;
        }

        return match ($ability) {
            'view' => true,
            'upload' => (bool) $access->can_upload,
            'manage_gallery' => (bool) $access->can_manage_gallery,
            default => false,
        };
    }
}
