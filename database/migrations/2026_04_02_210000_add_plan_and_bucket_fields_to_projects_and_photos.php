<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('owner_user_id')->nullable()->after('lead_id')->constrained('users')->nullOnDelete();
            $table->string('plan_code')->default(config('photography_plans.default', 'essential'))->after('status');
            $table->integer('weekly_download_limit')->nullable()->after('gallery_password');
            $table->integer('downloads_used_in_window')->default(0)->after('weekly_download_limit');
            $table->timestamp('downloads_window_started_at')->nullable()->after('downloads_used_in_window');
            $table->integer('retention_days')->nullable()->after('downloads_window_started_at');
            $table->unsignedBigInteger('storage_limit_bytes')->nullable()->after('retention_days');
            $table->integer('extra_download_quota')->default(0)->after('download_limit');
            $table->timestamp('originals_expires_at')->nullable()->after('full_gallery_price');
            $table->string('r2_zip_path')->nullable()->after('originals_expires_at');
        });

        Schema::table('photos', function (Blueprint $table) {
            $table->string('optimized_path')->nullable()->after('url');
            $table->string('original_path')->nullable()->after('optimized_path');
            $table->unsignedBigInteger('optimized_bytes')->nullable()->after('original_path');
            $table->unsignedBigInteger('original_bytes')->nullable()->after('optimized_bytes');
            $table->string('mime_type')->nullable()->after('original_bytes');
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->dropColumn([
                'optimized_path',
                'original_path',
                'optimized_bytes',
                'original_bytes',
                'mime_type',
            ]);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('owner_user_id');
            $table->dropColumn([
                'plan_code',
                'weekly_download_limit',
                'downloads_used_in_window',
                'downloads_window_started_at',
                'retention_days',
                'storage_limit_bytes',
                'extra_download_quota',
                'originals_expires_at',
                'r2_zip_path',
            ]);
        });
    }
};

