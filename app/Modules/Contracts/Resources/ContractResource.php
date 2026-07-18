<?php

namespace App\Modules\Contracts\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'title'      => $this->title,
            'status'     => $this->status,
            'signed_at'  => $this->signed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'project'    => $this->whenLoaded('project', fn () => [
                'id'   => $this->project->id,
                'name' => $this->project->name,
            ]),
        ];
    }
}
