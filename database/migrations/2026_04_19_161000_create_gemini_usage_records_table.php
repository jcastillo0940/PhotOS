<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gemini_usage_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('photo_id')->nullable()->constrained()->nullOnDelete();
            $table->string('request_id')->nullable()->index();
            $table->string('model')->nullable()->index();
            $table->unsignedInteger('prompt_tokens')->default(0);
            $table->unsignedInteger('candidate_tokens')->default(0);
            $table->unsignedInteger('total_tokens')->default(0);
            $table->decimal('input_cost_usd', 12, 6)->default(0);
            $table->decimal('output_cost_usd', 12, 6)->default(0);
            $table->decimal('total_cost_usd', 12, 6)->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gemini_usage_records');
    }
};
