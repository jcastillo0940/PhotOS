<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FaceIdentity extends Model
{
    use HasFactory;

    protected $fillable = [
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
