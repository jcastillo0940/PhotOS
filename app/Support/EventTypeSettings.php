<?php

namespace App\Support;

use App\Models\Setting;

class EventTypeSettings
{
    public static function defaults(): array
    {
        return [
            'Bodas',
            'Quinceaños',
            'Sesiones',
            'Empresarial',
            'Retratos',
            'Eventos',
        ];
    }

    public static function get(): array
    {
        $stored = Setting::get('event_types');

        if (!$stored) {
            return self::defaults();
        }

        $items = preg_split('/\r\n|\r|\n|,/', $stored) ?: [];

        $clean = collect($items)
            ->map(fn ($item) => trim((string) $item))
            ->filter()
            ->unique()
            ->values()
            ->all();

        return $clean ?: self::defaults();
    }

    public static function toMultilineString(): string
    {
        return implode("\n", self::get());
    }
}
