<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saas_plans', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->json('features')->nullable();
            $table->timestamps();
        });

        DB::table('saas_plans')->insert([
            [
                'code' => 'starter',
                'name' => 'Starter',
                'is_active' => true,
                'features' => json_encode([
                    'ai_scans' => 25,
                    'photo_uploads' => 500,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'studio',
                'name' => 'Studio',
                'is_active' => true,
                'features' => json_encode([
                    'ai_scans' => 150,
                    'photo_uploads' => 5000,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'scale',
                'name' => 'Scale',
                'is_active' => true,
                'features' => json_encode([
                    'ai_scans' => null,
                    'photo_uploads' => null,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('saas_plans');
    }
};