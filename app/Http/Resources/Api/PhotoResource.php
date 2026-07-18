<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PhotoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'url'               => $this->url,
            'thumbnail_url'     => $this->thumbnail_url,
            'processing_status' => $this->processing_status,
            'is_selected'       => $this->is_selected,
            'show_on_website'   => $this->show_on_website,
            'category'          => $this->category,
            'order_index'       => $this->order_index,
            'download_count'    => $this->download_count,
            'optimized_bytes'   => $this->optimized_bytes,
            'tags'              => $this->tags,
            'people_tags'       => $this->people_tags,
            'created_at'        => $this->created_at?->toIso8601String(),
        ];
    }
}
