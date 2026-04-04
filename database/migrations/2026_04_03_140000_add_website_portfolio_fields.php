<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('website_category')->nullable()->after('gallery_template_code');
            $table->text('website_description')->nullable()->after('website_category');
        });

        Schema::table('photos', function (Blueprint $table) {
            $table->boolean('show_on_website')->default(false)->after('is_selected');
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->dropColumn('show_on_website');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['website_category', 'website_description']);
        });
    }
};
