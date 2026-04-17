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
        $features = $this->features ?? [];
        $overrides = [
            'name' => $this->name,
            'features' => $features,
        ];

        foreach (['segment', 'price_monthly', 'price_yearly', 'price_monthly_promo', 'price_yearly_promo'] as $key) {
            if (array_key_exists($key, $features)) {
                $overrides[$key] = $features[$key];
            }
        }

        return SaasPlanCatalog::for($this->code, $overrides);
    }

    public function resolvedFeatures(): array
    {
        return $this->resolvedDefinition()['features'] ?? [];
    }
}
