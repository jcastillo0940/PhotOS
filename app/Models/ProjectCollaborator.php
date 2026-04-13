<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class ProjectCollaborator extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'project_id',
        'user_id',
        'invited_by_user_id',
        'invited_email',
        'role',
        'status',
        'access_code',
        'access_token',
        'access_token_hash',
        'can_upload',
        'can_manage_gallery',
        'accepted_at',
    ];

    protected $casts = [
        'can_upload' => 'boolean',
        'can_manage_gallery' => 'boolean',
        'accepted_at' => 'datetime',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withoutGlobalScope('tenant');
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id')->withoutGlobalScope('tenant');
    }

    public static function issueAccessToken(): array
    {
        $plain = Str::random(64);

        return [
            'plain' => $plain,
            'encrypted' => Crypt::encryptString($plain),
            'hash' => static::hashAccessToken($plain),
        ];
    }

    public static function hashAccessToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public static function findByPlainAccessToken(string $token): ?self
    {
        $hash = static::hashAccessToken($token);

        $collaborator = static::withoutGlobalScope('tenant')
            ->where('access_token_hash', $hash)
            ->first();

        if ($collaborator) {
            return $collaborator;
        }

        return static::withoutGlobalScope('tenant')
            ->where('access_token', $token)
            ->first();
    }

    public function plainAccessToken(): ?string
    {
        if (blank($this->access_token)) {
            return null;
        }

        try {
            return Crypt::decryptString((string) $this->access_token);
        } catch (\Throwable $e) {
            return (string) $this->access_token;
        }
    }
}
