<?php

namespace App\Support;

use App\Models\Setting;

class GalleryTemplate
{
    public const SETTING_KEY = 'active_gallery_template';

    public static function all(): array
    {
        return config('gallery_templates.templates', []);
    }

    public static function code(): string
    {
        $default = config('gallery_templates.default', 'cinematic-dark');
        $templates = self::all();
        $code = Setting::get(self::SETTING_KEY, $default) ?: $default;

        return array_key_exists($code, $templates) ? $code : $default;
    }

    public static function current(): array
    {
        return self::resolve(self::code());
    }

    public static function resolve(?string $code): array
    {
        $templates = self::all();
        $default = config('gallery_templates.default', 'cinematic-dark');

        return $templates[$code] ?? $templates[$default] ?? [];
    }

    public static function defaultCode(): string
    {
        return config('gallery_templates.default', 'cinematic-dark');
    }

    public static function defaultTemplateId(): ?int
    {
        return self::resolve(self::defaultCode())['id'] ?? null;
    }

    public static function firstAllowedCode(array $planDefinition): string
    {
        $allowed = $planDefinition['template_access'] ?? 'all';

        if ($allowed === 'all') {
            return self::defaultCode();
        }

        foreach (self::all() as $template) {
            if (in_array($template['id'] ?? null, $allowed, true)) {
                return $template['code'];
            }
        }

        return self::defaultCode();
    }

    public static function isAllowedForPlan(string $code, array $planDefinition): bool
    {
        $template = self::resolve($code);
        $allowed = $planDefinition['template_access'] ?? 'all';

        if ($allowed === 'all') {
            return true;
        }

        return in_array($template['id'] ?? null, $allowed, true);
    }
}
