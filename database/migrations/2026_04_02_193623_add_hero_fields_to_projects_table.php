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
        Schema::table('projects', function (Blueprint $table) {
            $table->unsignedBigInteger('hero_photo_id')->nullable();
            $table->string('hero_focus_x')->default('50%');
            $table->string('hero_focus_y')->default('50%');

            $table->foreign('hero_photo_id')->references('id')->on('photos')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['hero_photo_id']);
            $table->dropColumn(['hero_photo_id', 'hero_focus_x', 'hero_focus_y']);
        });
    }
};
