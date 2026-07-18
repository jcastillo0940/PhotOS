<?php

namespace App\Modules\Gallery\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'token'       => $this->gallery_token,
            'status'      => $this->gallery_status,
            'photos_count'=> $this->whenCounted('photos'),
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}
