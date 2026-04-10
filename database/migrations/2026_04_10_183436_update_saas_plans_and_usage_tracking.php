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

        // Clear old plans
        DB::table('saas_plans')->truncate();

        // Seed NEW Plans Matrix
        DB::table('saas_plans')->insert([
            [
                'code' => 'starter',
                'name' => 'Starter (Free)',
                'is_active' => true,
                'features' => json_encode([
                    'projects_limit' => 1,
                    'storage_gb' => 1,
                    'ai_scans_monthly' => 50,
                    'watermark' => 'branded',
                    'staff_limit' => 1,
                    'custom_domain' => false,
                    'price_monthly' => 0,
                    'price_yearly' => 0,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'professional',
                'name' => 'Professional',
                'is_active' => true,
                'features' => json_encode([
                    'projects_limit' => null, // unlimited
                    'storage_gb' => 50,
                    'ai_scans_monthly' => 2500,
                    'watermark' => 'custom',
                    'staff_limit' => 1,
                    'custom_domain' => false,
                    'price_monthly' => 29,
                    'price_monthly_promo' => 24, // 1st month
                    'price_yearly' => 290,
                    'price_yearly_promo' => 199, // 1st year
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'studio_gold',
                'name' => 'Studio Gold',
                'is_active' => true,
                'features' => json_encode([
                    'projects_limit' => null,
                    'storage_gb' => 250,
                    'ai_scans_monthly' => 10000,
                    'watermark' => 'white_label',
                    'staff_limit' => 5,
                    'custom_domain' => true,
                    'price_monthly' => 59,
                    'price_yearly' => 590,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['ai_scans_monthly_count', 'ai_scans_reset_at', 'grace_period_ends_at']);
        });
    }
};
