<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('face_identity_vectors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('face_identity_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->json('embedding'); // 512-dim InsightFace buffalo_l vector
            $table->enum('source_type', ['manual_upload', 'confirmed_match', 'ai_suggested'])->default('manual_upload');
            $table->boolean('is_primary')->default(false);
            $table->float('confidence')->nullable();
            $table->timestamps();

            $table->index(['face_identity_id', 'is_primary']);
        });

        // Existing 128-dim embeddings (face_recognition) are incompatible with
        // the new 512-dim InsightFace model — reset all for re-extraction.
        DB::table('face_identities')
            ->whereNotNull('embedding')
            ->update([
                'embedding' => null,
                'processing_status' => 'pending',
                'processing_note' => 'Pendiente de reprocesamiento con motor InsightFace (buffalo_l).',
                'processed_at' => null,
            ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('face_identity_vectors');
    }
};
