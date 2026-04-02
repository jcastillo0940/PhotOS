<?php

namespace App\Support;

use App\Models\Setting;

class InstallationPlan
{
    public const SETTING_KEY = 'installation_plan';

    public static function all(): array
    {
        return config('photography_plans.plans', []);
    }

    public static function code(): string
    {
        $default = config('photography_plans.default', 'essential');
        $plans = self::all();
        $code = Setting::get(self::SETTING_KEY, $default) ?: $default;

        return array_key_exists($code, $plans) ? $code : $default;
    }

    public static function current(): array
    {
        $plans = self::all();
        $default = config('photography_plans.default', 'essential');
        $code = self::code();

        return $plans[$code] ?? $plans[$default] ?? [];
    }
}
