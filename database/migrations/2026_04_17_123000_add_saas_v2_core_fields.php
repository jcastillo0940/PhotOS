<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (! Schema::hasColumn('tenants', 'custom_domain')) {
                $table->string('custom_domain')->nullable()->after('custom_domain_enabled');
            }
        });

        Schema::table('tenant_subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('tenant_subscriptions', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('current_period_ends_at');
            }
        });

        Schema::table('projects', function (Blueprint $table) {
            if (! Schema::hasColumn('projects', 'selected_sponsors')) {
                $table->json('selected_sponsors')->nullable()->after('face_recognition_enabled');
            }
        });

        Schema::table('photos', function (Blueprint $table) {
            if (! Schema::hasColumn('photos', 'gemini_request_id')) {
                $col = $table->string('gemini_request_id')->nullable();
                if (Schema::hasColumn('photos', 'gemini_tokens')) {
                    $col->after('gemini_tokens');
                }
            }

            if (! Schema::hasColumn('photos', 'gemini_batch_size')) {
                $col = $table->unsignedInteger('gemini_batch_size')->nullable();
                if (Schema::hasColumn('photos', 'gemini_request_id')) {
                    $col->after('gemini_request_id');
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            foreach (['gemini_batch_size', 'gemini_request_id'] as $column) {
                if (Schema::hasColumn('photos', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'selected_sponsors')) {
                $table->dropColumn('selected_sponsors');
            }
        });

        Schema::table('tenant_subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('tenant_subscriptions', 'expires_at')) {
                $table->dropColumn('expires_at');
            }
        });

        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'custom_domain')) {
                $table->dropColumn('custom_domain');
            }
        });
    }
};
