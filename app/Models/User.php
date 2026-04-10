<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Concerns\BelongsToTenant;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['tenant_id', 'name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use BelongsToTenant, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isDeveloper(): bool
    {
        return $this->role === 'developer';
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isOperator(): bool
    {
        return $this->role === 'operator';
    }

    public function isPhotographer(): bool
    {
        return $this->role === 'photographer';
    }

    public function canManageTenant(): bool
    {
        return $this->isDeveloper() || $this->isOwner() || $this->isOperator();
    }

    public function canManageBilling(): bool
    {
        return $this->isDeveloper() || $this->isOwner();
    }

    public function canManageSaas(): bool
    {
        return $this->isDeveloper();
    }

    public function projectCollaborations(): HasMany
    {
        return $this->hasMany(ProjectCollaborator::class)->withoutGlobalScope('tenant');
    }

    public function hasActiveProjectAccessForTenant(int $tenantId): bool
    {
        return $this->projectCollaborations()
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->exists();
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function ownedProjects()
    {
        return $this->hasMany(Project::class, 'owner_user_id');
    }
}
