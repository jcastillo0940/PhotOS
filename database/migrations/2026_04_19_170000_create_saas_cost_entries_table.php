<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saas_cost_entries', function (Blueprint $table) {
            $table->id();
            $table->date('period_start');
            $table->string('provider', 100);
            $table->string('service', 120);
            $table->string('cost_type', 20)->default('actual');
            $table->decimal('amount_usd', 12, 4)->default(0);
            $table->string('source', 30)->default('manual');
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['period_start', 'cost_type']);
            $table->index(['provider', 'service']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saas_cost_entries');
    }
};
