<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add usage tracking to tenants
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'ai_scans_monthly_count')) {
                $table->unsignedInteger('ai_scans_monthly_count')->default(0)->after('storage_limit_bytes');
                $table->timestamp('ai_scans_reset_at')->nullable()->after('ai_scans_monthly_count');
                $table->timestamp('grace_period_ends_at')->nullable()->after('status');
            }
        });

        // Plan seeding has been moved to SaasConfigurationSeeder
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['ai_scans_monthly_count', 'ai_scans_reset_at', 'grace_period_ends_at']);
        });
    }
};
