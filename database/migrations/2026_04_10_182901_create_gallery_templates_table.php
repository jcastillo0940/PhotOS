<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gallery_templates', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('tagline')->nullable();
            $table->text('description')->nullable();
            $table->string('layout')->default('hero-overlay');
            $table->string('mood')->default('clean');
            $table->string('accent_color')->default('#000000');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed from config
        $configTemplates = config('gallery_templates.templates', []);
        foreach ($configTemplates as $code => $tpl) {
            DB::table('gallery_templates')->insert([
                'code' => $code,
                'name' => $tpl['name'],
                'tagline' => $tpl['tagline'] ?? null,
                'description' => $tpl['description'] ?? null,
                'layout' => $tpl['layout'] ?? 'hero-overlay',
                'mood' => $tpl['mood'] ?? 'clean',
                'accent_color' => $tpl['accent'] ?? '#000000',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('gallery_templates');
    }
};
