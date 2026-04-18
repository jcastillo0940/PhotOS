<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FaceIdentityVector extends Model
{
    protected $fillable = [
        'face_identity_id',
        'tenant_id',
        'embedding',
        'source_type',
        'is_primary',
        'confidence',
    ];

    protected $casts = [
        'embedding' => 'array',
        'is_primary' => 'boolean',
        'confidence' => 'float',
    ];

    public function identity(): BelongsTo
    {
        return $this->belongsTo(FaceIdentity::class, 'face_identity_id');
    }
}
