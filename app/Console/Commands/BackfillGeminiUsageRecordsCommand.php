<?php

namespace App\Console\Commands;

use App\Models\GeminiUsageRecord;
use App\Models\Photo;
use App\Support\GeminiPricing;
use Illuminate\Console\Command;

class BackfillGeminiUsageRecordsCommand extends Command
{
    protected $signature = 'gemini:backfill-usage-records {--fresh : Elimina registros estimados previos y los reconstruye}';

    protected $description = 'Reconstruye registros historicos estimados de costo Gemini a partir de fotos legacy';

    public function handle(): int
    {
        if ($this->option('fresh')) {
            GeminiUsageRecord::query()->where('is_estimated', true)->delete();
            $this->info('Registros estimados previos eliminados.');
        }

        $created = 0;

        Photo::withoutGlobalScope('tenant')
            ->where(function ($query) {
                $query->whereNotNull('gemini_total_tokens')
                    ->orWhereNotNull('gemini_tokens');
            })
            ->orderBy('id')
            ->chunkById(200, function ($photos) use (&$created) {
                foreach ($photos as $photo) {
                    $existing = GeminiUsageRecord::query()
                        ->where('photo_id', $photo->id)
                        ->exists();

                    if ($existing) {
                        continue;
                    }

                    $model = $photo->gemini_model ?: 'gemini-2.5-flash';
                    $split = GeminiPricing::estimateSplitFromTotal($photo->gemini_total_tokens ?? $photo->gemini_tokens);

                    if ($split['total_tokens'] <= 0) {
                        continue;
                    }

                    $costs = GeminiPricing::calculate($model, $split['prompt_tokens'], $split['candidate_tokens']);

                    GeminiUsageRecord::create([
                        'tenant_id' => $photo->tenant_id,
                        'project_id' => $photo->project_id,
                        'photo_id' => $photo->id,
                        'request_id' => $photo->gemini_request_id ?: 'legacy-photo-'.$photo->id,
                        'model' => $model,
                        'prompt_tokens' => $split['prompt_tokens'],
                        'candidate_tokens' => $split['candidate_tokens'],
                        'total_tokens' => $split['total_tokens'],
                        'input_cost_usd' => $costs['input_cost_usd'] ?? 0,
                        'output_cost_usd' => $costs['output_cost_usd'] ?? 0,
                        'total_cost_usd' => $costs['total_cost_usd'] ?? 0,
                        'is_estimated' => true,
                        'metadata' => [
                            'source' => 'legacy_backfill',
                            'estimation_method' => 'prompt_85_output_15',
                            'legacy_total_tokens' => (int) ($photo->gemini_total_tokens ?? $photo->gemini_tokens ?? 0),
                        ],
                        'created_at' => $photo->updated_at ?? now(),
                        'updated_at' => now(),
                    ]);

                    $created++;
                }
            });

        $this->info("Registros creados: {$created}");

        return self::SUCCESS;
    }
}
