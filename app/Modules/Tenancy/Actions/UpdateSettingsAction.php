<?php

namespace App\Modules\Tenancy\Actions;

use App\Models\Setting;

class UpdateSettingsAction
{
    public function execute(string $key, mixed $value): void
    {
        Setting::set($key, $value);
    }
}
