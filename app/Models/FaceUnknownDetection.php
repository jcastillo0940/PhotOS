<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FaceUnknownDetection extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'photo_id',
        'face_index',
        'embedding',
        'bbox',
        'best_confidence',
        'best_match_identity_id',
        'status',
    ];

    protected $casts = [
        'embedding' => 'array',
        'bbox' => 'array',
        'best_confidence' => 'float',
    ];

    public function photo(): BelongsTo
    {
        return $this->belongsTo(Photo::class);
    }

    public function bestMatchIdentity(): BelongsTo
    {
        return $this->belongsTo(FaceIdentity::class, 'best_match_identity_id');
    }
}
