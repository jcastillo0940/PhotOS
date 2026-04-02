<?php

use App\Support\InstallationPlan;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('settings')) {
            return;
        }

        $existing = DB::table('settings')->where('key', InstallationPlan::SETTING_KEY)->first();
        if ($existing) {
            return;
        }

        $fallbackPlan = DB::table('projects')->orderBy('id')->value('plan_code') ?: config('photography_plans.default', 'essential');

        DB::table('settings')->insert([
            'key' => InstallationPlan::SETTING_KEY,
            'value' => $fallbackPlan,
            'group' => 'installation',
            'is_secret' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        if (!Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')->where('key', InstallationPlan::SETTING_KEY)->delete();
    }
};

