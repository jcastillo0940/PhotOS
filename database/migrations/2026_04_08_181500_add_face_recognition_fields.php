<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->boolean('face_recognition_enabled')->default(false)->after('website_description');
        });

        Schema::table('photos', function (Blueprint $table) {
            $table->json('people_tags')->nullable()->after('tags');
        });

        Schema::create('face_identities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->json('embedding')->nullable();
            $table->string('path_reference')->nullable();
            $table->timestamps();
            $table->index(['project_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('face_identities');

        Schema::table('photos', function (Blueprint $table) {
            $table->dropColumn('people_tags');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('face_recognition_enabled');
        });
    }
};
