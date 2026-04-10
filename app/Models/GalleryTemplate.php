<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GalleryTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'tagline',
        'description',
        'layout',
        'mood',
        'accent_color',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
