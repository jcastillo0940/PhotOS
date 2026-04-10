<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saas_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('studio_name');
            $table->string('slug')->index();
            $table->string('owner_name');
            $table->string('owner_email')->index();
            $table->string('owner_phone')->nullable();
            $table->string('plan_code', 50);
            $table->string('billing_cycle', 20)->default('monthly');
            $table->string('payment_gateway', 50)->nullable();
            $table->string('status', 50)->default('pending_payment');
            $table->string('requested_domain')->nullable();
            $table->string('provisioned_hostname')->nullable();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saas_registrations');
    }
};
