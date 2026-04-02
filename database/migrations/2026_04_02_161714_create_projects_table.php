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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('status')->default('active'); // active, pending_payment, editing, delivered
            $table->date('event_date')->nullable();
            $table->string('location')->nullable();
            $table->json('package_details')->nullable();
            $table->json('roadmap')->nullable(); // GPS, key contacts, session schedule
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
