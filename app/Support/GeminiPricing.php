<?php

namespace App\Support;

class GeminiPricing
{
    private const PRICES_PER_MILLION = [
        'gemini-2.5-flash' => [
            'input' => 0.30,
            'output' => 2.50,
        ],
        'gemini-2.5-pro' => [
            'input' => 1.25,
            'output' => 10.00,
        ],
    ];

    public static function ratesFor(?string $model): ?array
    {
        if (! is_string($model) || $model === '') {
            return null;
        }

        return self::PRICES_PER_MILLION[$model] ?? null;
    }

    public static function calculate(?string $model, ?int $promptTokens, ?int $candidateTokens): ?array
    {
        $rates = self::ratesFor($model);

        if (! $rates) {
            return null;
        }

        $prompt = max(0, (int) ($promptTokens ?? 0));
        $candidate = max(0, (int) ($candidateTokens ?? 0));
        $inputCost = ($prompt / 1_000_000) * $rates['input'];
        $outputCost = ($candidate / 1_000_000) * $rates['output'];

        return [
            'input_cost_usd' => round($inputCost, 6),
            'output_cost_usd' => round($outputCost, 6),
            'total_cost_usd' => round($inputCost + $outputCost, 6),
        ];
    }

    public static function estimateSplitFromTotal(?int $totalTokens, float $promptRatio = 0.85): array
    {
        $total = max(0, (int) ($totalTokens ?? 0));
        $prompt = (int) round($total * $promptRatio);
        $candidate = max(0, $total - $prompt);

        return [
            'prompt_tokens' => $prompt,
            'candidate_tokens' => $candidate,
            'total_tokens' => $total,
        ];
    }
}
