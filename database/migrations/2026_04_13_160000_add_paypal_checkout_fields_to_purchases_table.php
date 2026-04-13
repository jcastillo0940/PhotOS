<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->string('provider_order_id')->nullable()->after('type')->index();
            $table->string('provider_capture_id')->nullable()->after('provider_order_id')->index();
            $table->string('provider_status')->nullable()->after('provider_capture_id');
            $table->timestamp('benefit_applied_at')->nullable()->after('provider_status');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex(['provider_order_id']);
            $table->dropIndex(['provider_capture_id']);
            $table->dropColumn([
                'provider_order_id',
                'provider_capture_id',
                'provider_status',
                'benefit_applied_at',
            ]);
        });
    }
};
