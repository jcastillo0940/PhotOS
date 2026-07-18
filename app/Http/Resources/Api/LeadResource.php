<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'email'          => $this->email,
            'event_type'     => $this->event_type,
            'tentative_date' => $this->tentative_date,
            'status'         => $this->status,
            'notes'          => $this->notes,
            'nps_score'      => $this->nps_score,
            'last_active_at' => $this->last_active_at?->toIso8601String(),
            'client'         => $this->whenLoaded('client', fn () => [
                'id'        => $this->client->id,
                'full_name' => $this->client->full_name,
                'email'     => $this->client->email,
            ]),
            'project_id'  => $this->whenLoaded('project', fn () => $this->project?->id),
            'created_at'  => $this->created_at?->toIso8601String(),
            'updated_at'  => $this->updated_at?->toIso8601String(),
        ];
    }
}
