<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->json('briefing_answers')->nullable()->after('responses');
            $table->string('briefing_token')->nullable()->unique()->after('briefing_answers');
            $table->timestamp('briefing_sent_at')->nullable()->after('briefing_token');
            $table->timestamp('briefing_completed_at')->nullable()->after('briefing_sent_at');
            $table->unsignedTinyInteger('nps_score')->nullable()->after('briefing_completed_at');
            $table->text('nps_comment')->nullable()->after('nps_score');
            $table->string('nps_token')->nullable()->unique()->after('nps_comment');
            $table->timestamp('nps_sent_at')->nullable()->after('nps_token');
            $table->timestamp('nps_completed_at')->nullable()->after('nps_sent_at');
        });

        $now = now();

        $settings = [
            ['key' => 'smtp_enabled', 'value' => '0', 'group' => 'smtp', 'is_secret' => false],
            ['key' => 'smtp_host', 'value' => '', 'group' => 'smtp', 'is_secret' => false],
            ['key' => 'smtp_port', 'value' => '587', 'group' => 'smtp', 'is_secret' => false],
            ['key' => 'smtp_username', 'value' => '', 'group' => 'smtp', 'is_secret' => false],
            ['key' => 'smtp_password', 'value' => '', 'group' => 'smtp', 'is_secret' => true],
            ['key' => 'smtp_scheme', 'value' => 'tls', 'group' => 'smtp', 'is_secret' => false],
            ['key' => 'smtp_from_address', 'value' => '', 'group' => 'smtp', 'is_secret' => false],
            ['key' => 'smtp_from_name', 'value' => '', 'group' => 'smtp', 'is_secret' => false],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                array_merge($setting, ['created_at' => $now, 'updated_at' => $now])
            );
        }
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn([
                'briefing_answers',
                'briefing_token',
                'briefing_sent_at',
                'briefing_completed_at',
                'nps_score',
                'nps_comment',
                'nps_token',
                'nps_sent_at',
                'nps_completed_at',
            ]);
        });

        DB::table('settings')->whereIn('key', [
            'smtp_enabled',
            'smtp_host',
            'smtp_port',
            'smtp_username',
            'smtp_password',
            'smtp_scheme',
            'smtp_from_address',
            'smtp_from_name',
        ])->delete();
    }
};
