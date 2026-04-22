<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('domain_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30);
            $table->string('provider', 50)->default('cloudflare');
            $table->string('domain_name');
            $table->string('status', 50)->default('draft');
            $table->string('currency', 10)->default('USD');
            $table->decimal('amount', 10, 2)->nullable();
            $table->string('registrar_reference')->nullable();
            $table->foreignId('tenant_domain_id')->nullable()->constrained('tenant_domains')->nullOnDelete();
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'status']);
            $table->unique(['tenant_id', 'domain_name', 'type'], 'domain_orders_tenant_domain_type_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('domain_orders');
    }
};
