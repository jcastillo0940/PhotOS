<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            if (! Schema::hasColumn('photos', 'gemini_prompt_tokens')) {
                $table->unsignedInteger('gemini_prompt_tokens')->nullable()->after('gemini_tokens');
            }

            if (! Schema::hasColumn('photos', 'gemini_candidate_tokens')) {
                $table->unsignedInteger('gemini_candidate_tokens')->nullable()->after('gemini_prompt_tokens');
            }

            if (! Schema::hasColumn('photos', 'gemini_total_tokens')) {
                $table->unsignedInteger('gemini_total_tokens')->nullable()->after('gemini_candidate_tokens');
            }

            if (! Schema::hasColumn('photos', 'gemini_model')) {
                $table->string('gemini_model')->nullable()->after('gemini_total_tokens');
            }
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            foreach (['gemini_model', 'gemini_total_tokens', 'gemini_candidate_tokens', 'gemini_prompt_tokens'] as $column) {
                if (Schema::hasColumn('photos', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
