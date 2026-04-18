<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FaceIdentity extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'project_id',
        'name',
        'embedding',
        'path_reference',
        'processing_status',
        'processing_note',
        'processed_at',
    ];

    protected $casts = [
        'embedding' => 'array',
        'processed_at' => 'datetime',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function vectors(): HasMany
    {
        return $this->hasMany(FaceIdentityVector::class);
    }

    public function unknownDetections(): HasMany
    {
        return $this->hasMany(FaceUnknownDetection::class, 'best_match_identity_id');
    }

    public function allEmbeddings(): array
    {
        $vectors = $this->vectors->pluck('embedding')->filter()->values()->all();

        if (empty($vectors) && $this->embedding) {
            return [$this->embedding];
        }

        return $vectors;
    }
}
