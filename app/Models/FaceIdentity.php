<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FaceIdentity extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'project_id',
        'name',
        'embedding',
        'path_reference',
    ];

    protected $casts = [
        'embedding' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
