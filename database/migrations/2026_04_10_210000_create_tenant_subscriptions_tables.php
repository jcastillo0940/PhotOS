<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 50)->default('manual');
            $table->string('payment_mode', 50)->default('offline');
            $table->string('plan_code', 50);
            $table->string('billing_cycle', 20)->default('monthly');
            $table->string('status', 50)->default('pending');
            $table->decimal('amount', 10, 2)->nullable();
            $table->string('currency', 10)->default('USD');
            $table->string('paypal_product_id')->nullable();
            $table->string('paypal_plan_id')->nullable();
            $table->string('paypal_subscription_id')->nullable()->index();
            $table->string('paypal_customer_id')->nullable();
            $table->string('paypal_vault_token_id')->nullable();
            $table->text('paypal_approval_url')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('current_period_starts_at')->nullable();
            $table->timestamp('current_period_ends_at')->nullable();
            $table->timestamp('grace_ends_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->unsignedInteger('failed_payments_count')->default(0);
            $table->string('manual_override_status', 50)->nullable();
            $table->text('manual_override_reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('tenant_subscription_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_subscription_id')->nullable()->constrained('tenant_subscriptions')->nullOnDelete();
            $table->string('provider', 50)->default('manual');
            $table->string('type', 80);
            $table->string('status', 50)->default('pending');
            $table->decimal('amount', 10, 2)->nullable();
            $table->string('currency', 10)->default('USD');
            $table->string('reference')->nullable()->index();
            $table->timestamp('occurred_at')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_subscription_transactions');
        Schema::dropIfExists('tenant_subscriptions');
    }
};