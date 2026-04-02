<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('gallery_template_code')->nullable()->after('hero_focus_y');
        });

        Schema::create('download_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('photo_id')->nullable()->constrained()->nullOnDelete();
            $table->string('client_hash', 64)->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            $table->index(['project_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('download_logs');

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('gallery_template_code');
        });
    }
};
