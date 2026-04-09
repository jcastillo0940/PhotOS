<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'url', 'thumbnail_url', 'optimized_path', 'original_path', 'optimized_bytes', 'original_bytes',
        'mime_type', 'is_selected', 'show_on_website', 'download_count', 'order_index', 'category', 'tags', 'people_tags',
        'recognition_status', 'recognition_note', 'recognition_processed_at',
    ];

    protected $casts = [
        'is_selected' => 'boolean',
        'show_on_website' => 'boolean',
        'download_count' => 'integer',
        'order_index' => 'integer',
        'optimized_bytes' => 'integer',
        'original_bytes' => 'integer',
        'tags' => 'array',
        'people_tags' => 'array',
        'recognition_processed_at' => 'datetime',
    ];

    public function project() { return $this->belongsTo(Project::class); }
}
