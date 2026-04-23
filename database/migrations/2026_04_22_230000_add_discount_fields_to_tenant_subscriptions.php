<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_subscriptions', function (Blueprint $table) {
            $table->string('discount_type', 20)->nullable()->after('currency');
            $table->decimal('discount_value', 10, 2)->nullable()->after('discount_type');
            $table->string('discount_reason')->nullable()->after('discount_value');
            $table->timestamp('discount_ends_at')->nullable()->after('discount_reason');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_subscriptions', function (Blueprint $table) {
            $table->dropColumn([
                'discount_type',
                'discount_value',
                'discount_reason',
                'discount_ends_at',
            ]);
        });
    }
};
