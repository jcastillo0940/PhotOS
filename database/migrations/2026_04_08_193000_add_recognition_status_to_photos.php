<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->string('recognition_status', 30)->nullable()->after('people_tags');
            $table->string('recognition_note', 255)->nullable()->after('recognition_status');
            $table->timestamp('recognition_processed_at')->nullable()->after('recognition_note');
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->dropColumn([
                'recognition_status',
                'recognition_note',
                'recognition_processed_at',
            ]);
        });
    }
};
