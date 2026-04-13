<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->json('jersey_numbers')->nullable()->after('brand_tags');
            $table->json('sponsor_tags')->nullable()->after('jersey_numbers');
            $table->json('context_tags')->nullable()->after('sponsor_tags');
            $table->string('shot_type', 30)->nullable()->after('people_count_label');
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->dropColumn([
                'jersey_numbers',
                'sponsor_tags',
                'context_tags',
                'shot_type',
            ]);
        });
    }
};
