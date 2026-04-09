<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gallery_email_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('visitor_name')->nullable();
            $table->string('visitor_email');
            $table->string('client_hash', 64)->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            $table->unique(['project_id', 'visitor_email']);
            $table->index(['project_id', 'created_at']);
        });

        Schema::create('gallery_favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('photo_id')->constrained()->cascadeOnDelete();
            $table->string('visitor_email')->nullable();
            $table->string('client_hash', 64)->index();
            $table->timestamps();
            $table->unique(['photo_id', 'client_hash']);
            $table->index(['project_id', 'created_at']);
        });

        Schema::create('gallery_favorite_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('photo_id')->nullable()->constrained()->nullOnDelete();
            $table->string('visitor_email')->nullable();
            $table->string('client_hash', 64)->index();
            $table->string('action', 20)->default('added');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            $table->index(['project_id', 'created_at']);
        });

        Schema::table('download_logs', function (Blueprint $table) {
            $table->string('asset_type')->default('photo')->after('photo_id');
            $table->string('visitor_email')->nullable()->after('client_hash');
        });
    }

    public function down(): void
    {
        Schema::table('download_logs', function (Blueprint $table) {
            $table->dropColumn(['asset_type', 'visitor_email']);
        });

        Schema::dropIfExists('gallery_favorite_logs');
        Schema::dropIfExists('gallery_favorites');
        Schema::dropIfExists('gallery_email_registrations');
    }
};
