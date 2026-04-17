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
        Schema::table('face_identities', function (Blueprint $table) {
            $table->text('processing_note')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('face_identities', function (Blueprint $table) {
            $table->string('processing_note', 255)->nullable()->change();
        });
    }
};
