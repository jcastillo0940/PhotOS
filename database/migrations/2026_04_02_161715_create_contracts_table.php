<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->longText('content'); // The generated contract HTML/MD
            $table->string('status')->default('pending'); // pending, signed
            $table->timestamp('signed_at')->nullable();
            $table->longText('signature_data')->nullable(); // Drawing storage
            $table->string('token')->unique(); // Public Hash access
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
