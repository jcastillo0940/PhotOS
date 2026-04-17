<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_collaborators', function (Blueprint $table) {
            $table->string('access_token', 191)->change();
        });
    }

    public function down(): void
    {
        Schema::table('project_collaborators', function (Blueprint $table) {
            $table->string('access_token', 80)->change();
        });
    }
};
