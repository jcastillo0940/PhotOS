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
                    'projects_limit' => 3,
                    'storage_gb' => 30,
                    'photos_per_month' => 0,
                    'ai_scans_monthly' => 0,
                    'staff_limit' => 1,
                    'custom_domain' => false,
                    'ai_face_recognition' => false,
                    'ai_sponsor_detection' => false,
                    'sponsor_selection_limit' => 0,
                    'requires_explicit_sponsors' => false,
                    'gemini_model' => 'gemini-2.5-flash',
                    'gemini_rpm' => 0,
                    'gemini_rpd' => 0,
                    'gemini_paid_tier' => false,
                ],
            ],
            'starter' => [
                'code' => 'starter',
                'name' => 'AI Starter',
                'segment' => 'b2c',
                'price_monthly' => 29,
                'price_yearly' => 290,
                'features' => [
                    'projects_limit' => 25,
                    'storage_gb' => 500,
                    'photos_per_month' => 2000,
                    'ai_scans_monthly' => 2000,
                    'staff_limit' => 1,
                    'custom_domain' => false,
                    'ai_face_recognition' => true,
                    'ai_sponsor_detection' => false,
                    'sponsor_selection_limit' => 0,
                    'requires_explicit_sponsors' => false,
                    'gemini_model' => 'gemini-2.5-flash',
                    'gemini_rpm' => 15,
                    'gemini_rpd' => 1500,
                    'gemini_paid_tier' => false,
                ],
            ],
            'pro' => [
                'code' => 'pro',
                'name' => 'AI Pro',
                'segment' => 'b2b',
                'price_monthly' => 79,
                'price_yearly' => 790,
                'features' => [
                    'projects_limit' => 100,
                    'storage_gb' => 1000,
                    'photos_per_month' => 6000,
                    'ai_scans_monthly' => 6000,
                    'staff_limit' => 3,
                    'custom_domain' => true,
                    'ai_face_recognition' => true,
                    'ai_sponsor_detection' => true,
                    'sponsor_selection_limit' => 20,
                    'requires_explicit_sponsors' => true,
                    'gemini_model' => 'gemini-2.5-flash',
                    'gemini_rpm' => 60,
                    'gemini_rpd' => 6000,
                    'gemini_paid_tier' => true,
                ],
            ],
            'business' => [
                'code' => 'business',
                'name' => 'AI Business',
                'segment' => 'b2b',
                'price_monthly' => 149,
                'price_yearly' => 1490,
                'features' => [
                    'projects_limit' => 300,
                    'storage_gb' => 2500,
                    'photos_per_month' => 20000,
                    'ai_scans_monthly' => 20000,
                    'staff_limit' => 10,
                    'custom_domain' => true,
                    'ai_face_recognition' => true,
                    'ai_sponsor_detection' => true,
                    'sponsor_selection_limit' => 50,
                    'requires_explicit_sponsors' => true,
                    'gemini_model' => 'gemini-2.5-flash',
                    'gemini_rpm' => 200,
                    'gemini_rpd' => 20000,
                    'gemini_paid_tier' => true,
                ],
            ],
            'enterprise' => [
                'code' => 'enterprise',
                'name' => 'Enterprise',
                'segment' => 'b2b',
                'price_monthly' => 699,
                'price_yearly' => 8388,
                'features' => [
                    'projects_limit' => null,
                    'storage_gb' => 10000,
                    'photos_per_month' => 75000,
                    'ai_scans_monthly' => 75000,
                    'staff_limit' => null,
                    'custom_domain' => true,
                    'ai_face_recognition' => true,
                    'ai_sponsor_detection' => true,
                    'sponsor_selection_limit' => null,
                    'requires_explicit_sponsors' => true,
                    'gemini_model' => 'gemini-2.5-flash',
                    'gemini_rpm' => 1000,
                    'gemini_rpd' => 75000,
                    'gemini_paid_tier' => true,
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
