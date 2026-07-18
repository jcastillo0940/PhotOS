<?php

namespace App\Modules\Tenancy\Actions;

use App\Models\Setting;

class UpdateBrandingAction
{
    public function execute(array $brandingData): void
    {
        foreach ($brandingData as $key => $value) {
            Setting::set($key, $value);
        }
    }
}
