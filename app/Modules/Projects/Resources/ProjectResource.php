<?php

namespace App\Modules\Projects\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'status'       => $this->status,
            'event_date'   => $this->event_date,
            'location'     => $this->location,
            'client'       => $this->whenLoaded('client', fn () => [
                'id'        => $this->client->id,
                'full_name' => $this->client->full_name,
                'email'     => $this->client->email,
            ]),
            'gallery_token'    => $this->gallery_token,
            'gallery_password' => $this->gallery_password,
            'photos_count'     => $this->whenCounted('photos'),
            'storage_used_bytes' => $this->when(
                isset($this->storage_limit_bytes),
                $this->storage_limit_bytes
            ),
            'face_recognition_enabled' => $this->face_recognition_enabled,
            'created_at'   => $this->created_at?->toIso8601String(),
            'updated_at'   => $this->updated_at?->toIso8601String(),
        ];
    }
}
