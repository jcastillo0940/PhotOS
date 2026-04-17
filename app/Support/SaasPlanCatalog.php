<?php

namespace App\Support;

class SaasPlanCatalog
{
    public static function defaults(): array
    {
        return [
            'basic' => [
                'code' => 'basic',
                'name' => 'Basic Vault',
                'segment' => 'b2c',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'features' => [
                    'storage_gb' => 300,
                    'photos_per_month' => 0,
                    'ai_scans_monthly' => 0,
                    'staff_limit' => 1,
                    'custom_domain' => false,
                    'ai_face_recognition' => false,
                    'ai_sponsor_detection' => false,
                    'sponsor_selection_limit' => 0,
                    'requires_explicit_sponsors' => false,
                ],
            ],
            'starter' => [
                'code' => 'starter',
                'name' => 'AI Starter',
                'segment' => 'b2c',
                'price_monthly' => 29,
                'price_yearly' => 290,
                'features' => [
                    'storage_gb' => 500,
                    'photos_per_month' => 2000,
                    'ai_scans_monthly' => 2000,
                    'staff_limit' => 1,
                    'custom_domain' => false,
                    'ai_face_recognition' => true,
                    'ai_sponsor_detection' => false,
                    'sponsor_selection_limit' => 0,
                    'requires_explicit_sponsors' => false,
                ],
            ],
            'pro' => [
                'code' => 'pro',
                'name' => 'AI Pro',
                'segment' => 'b2b',
                'price_monthly' => 79,
                'price_yearly' => 790,
                'features' => [
                    'storage_gb' => 1000,
                    'photos_per_month' => 6000,
                    'ai_scans_monthly' => 6000,
                    'staff_limit' => 3,
                    'custom_domain' => true,
                    'ai_face_recognition' => true,
                    'ai_sponsor_detection' => true,
                    'sponsor_selection_limit' => 20,
                    'requires_explicit_sponsors' => true,
                ],
            ],
            'business' => [
                'code' => 'business',
                'name' => 'AI Business',
                'segment' => 'b2b',
                'price_monthly' => 149,
                'price_yearly' => 1490,
                'features' => [
                    'storage_gb' => 2500,
                    'photos_per_month' => 20000,
                    'ai_scans_monthly' => 20000,
                    'staff_limit' => 10,
                    'custom_domain' => true,
                    'ai_face_recognition' => true,
                    'ai_sponsor_detection' => true,
                    'sponsor_selection_limit' => 50,
                    'requires_explicit_sponsors' => true,
                ],
            ],
            'enterprise' => [
                'code' => 'enterprise',
                'name' => 'Enterprise',
                'segment' => 'b2b',
                'price_monthly' => 299,
                'price_yearly' => 2990,
                'features' => [
                    'storage_gb' => 10000,
                    'photos_per_month' => 75000,
                    'ai_scans_monthly' => 75000,
                    'staff_limit' => null,
                    'custom_domain' => true,
                    'ai_face_recognition' => true,
                    'ai_sponsor_detection' => true,
                    'sponsor_selection_limit' => null,
                    'requires_explicit_sponsors' => true,
                ],
            ],
        ];
    }

    public static function for(string $code, array $overrides = []): array
    {
        $base = static::defaults()[$code] ?? [
            'code' => $code,
            'name' => ucfirst($code),
            'segment' => 'custom',
            'features' => [],
        ];

        $overrideFeatures = $overrides['features'] ?? [];
        unset($overrides['features']);

        return array_merge($base, $overrides, [
            'features' => array_merge($base['features'] ?? [], $overrideFeatures),
        ]);
    }

    public static function features(string $code, array $overrides = []): array
    {
        return static::for($code, ['features' => $overrides])['features'];
    }
}
