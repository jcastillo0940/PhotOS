<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GalleryEmailRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'visitor_name',
        'visitor_email',
        'client_hash',
        'ip_address',
        'user_agent',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
