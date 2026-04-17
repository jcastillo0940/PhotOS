<?php

namespace App\Models;

use App\Support\SaasPlanCatalog;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaasPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'is_active',
        'features',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'features' => 'array',
    ];

    public function featureValue(string $feature): mixed
    {
        return data_get($this->resolvedFeatures(), $feature);
    }

    public function resolvedDefinition(): array
    {
        return SaasPlanCatalog::for($this->code, [
            'name' => $this->name,
            'features' => $this->features ?? [],
        ]);
    }

    public function resolvedFeatures(): array
    {
        return $this->resolvedDefinition()['features'] ?? [];
    }
}
