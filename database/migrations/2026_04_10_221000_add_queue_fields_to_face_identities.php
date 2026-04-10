<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('face_identities', function (Blueprint $table) {
            $table->string('processing_status', 30)->default('pending')->after('embedding');
            $table->string('processing_note', 255)->nullable()->after('processing_status');
            $table->timestamp('processed_at')->nullable()->after('processing_note');
        });
    }

    public function down(): void
    {
        Schema::table('face_identities', function (Blueprint $table) {
            $table->dropColumn(['processing_status', 'processing_note', 'processed_at']);
        });
    }
};