<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('face_unknown_detections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->foreignId('photo_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('face_index');
            $table->json('embedding'); // 512-dim InsightFace vector
            $table->json('bbox')->nullable(); // [x1_pct, y1_pct, x2_pct, y2_pct] 0-1 range
            $table->float('best_confidence')->nullable();
            $table->foreignId('best_match_identity_id')
                ->nullable()
                ->constrained('face_identities')
                ->nullOnDelete();
            $table->enum('status', ['unknown', 'confirmed', 'rejected'])->default('unknown');
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['photo_id', 'face_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('face_unknown_detections');
    }
};
