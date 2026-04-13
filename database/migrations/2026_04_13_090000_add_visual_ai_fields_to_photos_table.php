<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->json('brand_tags')->nullable()->after('people_tags');
            $table->unsignedTinyInteger('people_count')->nullable()->after('brand_tags');
            $table->string('people_count_label', 30)->nullable()->after('people_count');
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->dropColumn([
                'brand_tags',
                'people_count',
                'people_count_label',
            ]);
        });
    }
};
