<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domain_orders', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('error_message');
            $table->unsignedInteger('verification_attempts')->default(0)->after('notes');
            $table->timestamp('last_checked_at')->nullable()->after('verification_attempts');
            $table->timestamp('next_check_at')->nullable()->after('last_checked_at');
            $table->string('manual_state', 50)->nullable()->after('next_check_at');
        });
    }

    public function down(): void
    {
        Schema::table('domain_orders', function (Blueprint $table) {
            $table->dropColumn([
                'notes',
                'verification_attempts',
                'last_checked_at',
                'next_check_at',
                'manual_state',
            ]);
        });
    }
};
