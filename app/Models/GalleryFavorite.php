<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GalleryFavorite extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'photo_id',
        'visitor_email',
        'client_hash',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function photo()
    {
        return $this->belongsTo(Photo::class);
    }
}
