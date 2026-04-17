<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'project_id', 'url', 'thumbnail_url', 'optimized_path', 'original_path', 'optimized_bytes', 'original_bytes',
        'mime_type', 'is_selected', 'show_on_website', 'download_count', 'order_index', 'category', 'tags', 'people_tags',
        'brand_tags', 'jersey_numbers', 'sponsor_tags', 'context_tags', 'action_tags', 'people_count', 'people_count_label', 'shot_type',
        'recognition_status', 'recognition_note', 'recognition_processed_at',
        'gemini_tokens', 'gemini_request_id', 'gemini_batch_size',
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
        'brand_tags' => 'array',
        'jersey_numbers' => 'array',
        'sponsor_tags' => 'array',
        'context_tags' => 'array',
        'action_tags' => 'array',
        'people_count' => 'integer',
        'gemini_tokens' => 'integer',
        'gemini_batch_size' => 'integer',
        'recognition_processed_at' => 'datetime',
    ];

    public function project() { return $this->belongsTo(Project::class); }

    public function scopeWithBrand(Builder $query, string $brand): Builder
    {
        return $query->whereJsonContains('brand_tags', trim($brand));
    }

    public function scopeWithPeopleCountLabel(Builder $query, string $label): Builder
    {
        return $query->where('people_count_label', trim($label));
    }

    public function scopeWithJerseyNumber(Builder $query, string $number): Builder
    {
        return $query->whereJsonContains('jersey_numbers', trim($number));
    }

    public function scopeWithSponsor(Builder $query, string $sponsor): Builder
    {
        return $query->whereJsonContains('sponsor_tags', trim($sponsor));
    }

    public function scopeWithContextTag(Builder $query, string $tag): Builder
    {
        return $query->whereJsonContains('context_tags', trim($tag));
    }
}
