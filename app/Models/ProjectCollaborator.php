<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
