<?php

namespace App\Support;

use App\Models\Setting;
use App\Models\Tenant;

class TenantBrandPreset
{
    public static function all(): array
    {
        return [
            'editorial-warm' => [
                'label' => 'Editorial Warm',
                'tagline' => 'Soft moments, captured with heart.',
                'theme' => [
                    'preset' => 'editorial-warm',
                    'font_heading' => 'Fraunces, Georgia, serif',
                    'font_body' => 'Inter, system-ui, sans-serif',
                ],
                'gallery_template_code' => 'editorial-frame',
                'homepage' => [
                    'hero' => [
                        'eyebrow' => 'Editorial photographer',
                        'title' => 'Historias elegantes, cercanas y llenas de atmosfera.',
                        'description' => 'Un front pensado para fotografos que quieren vender una experiencia cuidada, emocional y con direccion visual.',
                        'floating_caption' => 'Soft storytelling for modern clients',
                    ],
                    'about' => [
                        'heading' => 'Fotografia con textura, calma y una direccion que se siente natural.',
                    ],
                ],
            ],
            'coastal-light' => [
                'label' => 'Coastal Light',
                'tagline' => 'Clean light, natural movement, and destination stories.',
                'theme' => [
                    'preset' => 'coastal-light',
                    'font_heading' => 'Fraunces, Georgia, serif',
                    'font_body' => 'Manrope, Inter, system-ui, sans-serif',
                ],
                'gallery_template_code' => 'split-story',
                'homepage' => [
                    'hero' => [
                        'eyebrow' => 'Destination photographer',
                        'title' => 'Sesiones luminosas para marcas, parejas y viajes con identidad propia.',
                        'description' => 'Ideal para estudios que venden naturalidad, exteriores, costa, aventura y una experiencia fresca.',
                        'floating_caption' => 'Coastal visuals with clean energy',
                    ],
                    'about' => [
                        'heading' => 'Imagenes que respiran espacio, luz y movimiento real.',
                    ],
                ],
            ],
            'midnight-luxe' => [
                'label' => 'Midnight Luxe',
                'tagline' => 'Luxury visuals with contrast, mood, and intention.',
                'theme' => [
                    'preset' => 'midnight-luxe',
                    'font_heading' => 'Cormorant Garamond, Georgia, serif',
                    'font_body' => 'Inter, system-ui, sans-serif',
                ],
                'gallery_template_code' => 'cinematic-dark',
                'homepage' => [
                    'hero' => [
                        'eyebrow' => 'Luxury visual studio',
                        'title' => 'Un front con presencia premium para estudios que venden impacto.',
                        'description' => 'Perfecto para fotografia editorial, bodas upscale, campañas y clientes que esperan una puesta en escena mas dramatica.',
                        'floating_caption' => 'Cinematic work with premium presence',
                    ],
                    'about' => [
                        'heading' => 'Direccion visual con contraste, elegancia y una presencia mas audaz.',
                    ],
                ],
            ],
        ];
    }

    public static function options(): array
    {
        return collect(self::all())
            ->map(fn (array $preset, string $key) => [
                'key' => $key,
                'label' => $preset['label'],
                'gallery_template_code' => $preset['gallery_template_code'],
            ])
            ->values()
            ->all();
    }

    public static function defaultKey(): string
    {
        return 'editorial-warm';
    }

    public static function apply(Tenant $tenant, ?string $presetKey = null): void
    {
        $presetKey = $presetKey ?: self::defaultKey();
        $preset = self::all()[$presetKey] ?? self::all()[self::defaultKey()];

        Setting::setForTenant($tenant->id, 'app_name', $tenant->name, 'branding');
        Setting::setForTenant($tenant->id, 'photographer_business_name', $tenant->name, 'legal');
        Setting::setForTenant($tenant->id, 'app_tagline', $preset['tagline'], 'branding');

        GalleryTemplate::setDefaultCode($preset['gallery_template_code'], $tenant->id);

        $homepage = HomepageSettings::defaults($tenant->id);
        $homepage['brand']['name'] = $tenant->name;
        $homepage['brand']['tagline'] = $preset['tagline'];
        $homepage = self::mergeRecursive($homepage, $preset['homepage'] ?? []);
        HomepageSettings::save(HomepageSettings::sanitize($homepage, $tenant->id), $tenant->id);

        TenantThemeSettings::save($preset['theme'] ?? [], $tenant->id);
    }

    private static function mergeRecursive(array $base, array $overrides): array
    {
        foreach ($overrides as $key => $value) {
            if (is_array($value) && isset($base[$key]) && is_array($base[$key])) {
                $base[$key] = self::mergeRecursive($base[$key], $value);
                continue;
            }

            $base[$key] = $value;
        }

        return $base;
    }
}
