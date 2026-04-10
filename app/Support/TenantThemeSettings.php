<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Schema;

class TenantThemeSettings
{
    public const SETTING_KEY = 'homepage_theme';

    public static function defaults(): array
    {
        return [
            'preset' => 'editorial-warm',
            'font_heading' => 'Fraunces, Georgia, serif',
            'font_body' => 'Inter, system-ui, sans-serif',
        ];
    }

    public static function presets(): array
    {
        return [
            'editorial-warm' => [
                'label' => 'Editorial Warm',
                'palette' => [
                    'hero_overlay' => 'rgba(26,19,13,.62)',
                    'surface' => '#f9f6f1',
                    'surface_alt' => '#f5efe7',
                    'surface_dark' => '#221914',
                    'text' => '#241b16',
                    'muted' => '#6b594c',
                    'accent' => '#c69b72',
                    'accent_soft' => '#f4eadf',
                ],
            ],
            'coastal-light' => [
                'label' => 'Coastal Light',
                'palette' => [
                    'hero_overlay' => 'rgba(12,35,46,.55)',
                    'surface' => '#f4f8f8',
                    'surface_alt' => '#eaf2f2',
                    'surface_dark' => '#15313b',
                    'text' => '#18323a',
                    'muted' => '#58727a',
                    'accent' => '#3f8fa6',
                    'accent_soft' => '#dceff4',
                ],
            ],
            'midnight-luxe' => [
                'label' => 'Midnight Luxe',
                'palette' => [
                    'hero_overlay' => 'rgba(10,10,20,.72)',
                    'surface' => '#12131a',
                    'surface_alt' => '#191b24',
                    'surface_dark' => '#0b0c12',
                    'text' => '#f3efe8',
                    'muted' => '#b7ab9b',
                    'accent' => '#c2a36f',
                    'accent_soft' => '#2b2721',
                ],
            ],
        ];
    }

    public static function get(?int $tenantId = null): array
    {
        if (!Schema::hasTable('settings')) {
            return self::toFrontend(self::defaults());
        }

        $stored = Setting::getForTenant($tenantId, self::SETTING_KEY);

        if (!$stored) {
            $defaults = self::defaults();
            self::save($defaults, $tenantId);

            return self::toFrontend($defaults);
        }

        $decoded = json_decode($stored, true);

        if (!is_array($decoded)) {
            $defaults = self::defaults();
            self::save($defaults, $tenantId);

            return self::toFrontend($defaults);
        }

        return self::toFrontend(array_merge(self::defaults(), $decoded));
    }

    public static function save(array $content, ?int $tenantId = null): void
    {
        if (!Schema::hasTable('settings')) {
            return;
        }

        Setting::setForTenant(
            $tenantId,
            self::SETTING_KEY,
            json_encode(self::sanitize($content), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'homepage'
        );
    }

    public static function sanitize(array $content): array
    {
        $defaults = self::defaults();
        $preset = $content['preset'] ?? $defaults['preset'];

        if (!array_key_exists($preset, self::presets())) {
            $preset = $defaults['preset'];
        }

        return [
            'preset' => $preset,
            'font_heading' => trim((string) ($content['font_heading'] ?? $defaults['font_heading'])),
            'font_body' => trim((string) ($content['font_body'] ?? $defaults['font_body'])),
        ];
    }

    public static function toFrontend(array $content): array
    {
        $sanitized = self::sanitize($content);
        $preset = self::presets()[$sanitized['preset']];

        return array_merge($sanitized, [
            'label' => $preset['label'],
            'palette' => $preset['palette'],
            'presets' => collect(self::presets())->map(fn ($item, $key) => [
                'key' => $key,
                'label' => $item['label'],
            ])->values()->all(),
        ]);
    }
}
