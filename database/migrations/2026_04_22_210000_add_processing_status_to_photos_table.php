<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->string('processing_status', 30)->nullable()->after('gemini_path');
            $table->string('processing_note', 255)->nullable()->after('processing_status');
            $table->timestamp('processing_started_at')->nullable()->after('processing_note');
            $table->timestamp('processed_at')->nullable()->after('processing_started_at');
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->dropColumn([
                'processing_status',
                'processing_note',
                'processing_started_at',
                'processed_at',
            ]);
        });
    }
};
