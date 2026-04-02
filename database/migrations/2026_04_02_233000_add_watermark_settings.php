<?php

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

        $settings = [
            [
                'key' => 'platform_watermark_label',
                'value' => 'PhotOS',
                'group' => 'branding',
                'is_secret' => false,
            ],
            [
                'key' => 'photographer_watermark_path',
                'value' => null,
                'group' => 'branding',
                'is_secret' => false,
            ],
        ];

        foreach ($settings as $setting) {
            $exists = DB::table('settings')->where('key', $setting['key'])->exists();

            if (!$exists) {
                DB::table('settings')->insert([
                    ...$setting,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')->whereIn('key', [
            'platform_watermark_label',
            'photographer_watermark_path',
        ])->delete();
    }
};
