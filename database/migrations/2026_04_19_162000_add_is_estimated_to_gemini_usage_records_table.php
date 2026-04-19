<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gemini_usage_records', function (Blueprint $table) {
            if (! Schema::hasColumn('gemini_usage_records', 'is_estimated')) {
                $table->boolean('is_estimated')->default(false)->after('total_cost_usd');
            }
        });
    }

    public function down(): void
    {
        Schema::table('gemini_usage_records', function (Blueprint $table) {
            if (Schema::hasColumn('gemini_usage_records', 'is_estimated')) {
                $table->dropColumn('is_estimated');
            }
        });
    }
};
