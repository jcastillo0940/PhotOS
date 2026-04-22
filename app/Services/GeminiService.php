<?php

namespace App\Services;

use App\Models\Photo;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GeminiService
{
    private string $apiKey;
    private string $defaultModel;

    private const SYSTEM_INSTRUCTION = 'Analiza la imagen deportiva. Responde unicamente en JSON para ahorrar tokens: marca: solo la marca de la camiseta (Ej: "Nike"). Si no hay, "N/A". dorsal: solo el numero visible como string. Si no hay, "0". contexto: descripcion tecnica en maximo 60 caracteres (Ej: "Delantero rematando de cabeza en area pequena"). accion: una sola palabra de esta lista: [Gol, Falta, Penal, Tiro_libre, Disputa, Celebracion, Atajada, Otro]. No incluyas prosa ni explicaciones. Solo el objeto JSON.';

    private const VALID_ACTIONS = [
        'Gol', 'Falta', 'Penal', 'Tiro_libre', 'Disputa', 'Celebracion', 'Atajada', 'Otro',
    ];

    public function __construct()
    {
        $this->apiKey = (string) config('services.gemini.api_key', '');
        $this->defaultModel = (string) config('services.gemini.model', 'gemini-2.5-flash');
    }

    public function enabled(): bool
    {
        return filled($this->apiKey);
    }

    public function analyzePhoto(Photo $photo, ?string $model = null): array
    {
        if (! $this->enabled()) {
            throw new \RuntimeException('GEMINI_API_KEY no esta configurada.');
        }

        $modelToUse = filled($model) ? $model : $this->defaultModel;
        $imageUrl = $this->resolvePhotoUrl($photo);

        \Log::channel('daily')->info('[GEMINI DEBUG] resolvePhotoUrl result', [
            'photo_id' => $photo->id,
            'gemini_path' => $photo->gemini_path,
            'optimized_path' => $photo->optimized_path,
            'resolved_url' => $imageUrl ? substr($imageUrl, 0, 120).'...' : null,
        ]);

        if (! $imageUrl) {
            throw new \RuntimeException('No se pudo obtener la URL de la foto.');
        }

        $imageResponse = Http::timeout(20)->get($imageUrl);

        \Log::channel('daily')->info('[GEMINI DEBUG] Image download', [
            'status' => $imageResponse->status(),
            'content_type' => $imageResponse->header('Content-Type'),
            'bytes' => strlen($imageResponse->body()),
        ]);

        if (! $imageResponse->successful()) {
            throw new \RuntimeException('No se pudo descargar la imagen para analisis.');
        }

        $base64 = base64_encode($imageResponse->body());
        $mimeType = $imageResponse->header('Content-Type') ?: 'image/jpeg';
        $mimeType = explode(';', $mimeType)[0];

        \Log::channel('daily')->info('[GEMINI DEBUG] Sending to Gemini API', [
            'model' => $modelToUse,
            'mimeType' => $mimeType,
            'base64_kb' => round(strlen($base64) / 1024, 1),
        ]);

        $payload = $this->sanitizeForJson([
            'system_instruction' => [
                'parts' => [['text' => self::SYSTEM_INSTRUCTION]],
            ],
            'contents' => [[
                'parts' => [
                    ['inlineData' => ['mimeType' => $mimeType, 'data' => $base64]],
                ],
            ]],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'maxOutputTokens' => 2048,
                'temperature' => 0.1,
            ],
        ]);

        $jsonPayload = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        if ($jsonPayload === false) {
            throw new \RuntimeException('No se pudo preparar la solicitud Gemini: '.json_last_error_msg());
        }

        $response = Http::timeout(30)
            ->withBody($jsonPayload, 'application/json')
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$modelToUse}:generateContent?key={$this->apiKey}");

        \Log::channel('daily')->info('[GEMINI DEBUG] Gemini API response', [
            'http_status' => $response->status(),
            'body_snippet' => substr($response->body(), 0, 500),
        ]);

        if (! $response->successful()) {
            $body = $response->body();
            $detail = json_decode($body, true)['error']['message'] ?? $body;
            throw new \RuntimeException("Error Gemini API {$response->status()} [{$modelToUse}]: {$detail}");
        }

        $data = $response->json();
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
        $usage = $data['usageMetadata'] ?? [];
        $tokens = $usage['totalTokenCount'] ?? null;
        $promptTokens = $usage['promptTokenCount'] ?? null;
        $candidateTokens = $usage['candidatesTokenCount'] ?? null;
        $requestId = $response->header('x-request-id')
            ?: $response->header('x-google-request-id')
            ?: (string) Str::uuid();

        $parsed = json_decode($text, true);
        if (! is_array($parsed)) {
            if (preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $text, $m)) {
                $parsed = json_decode($m[1], true) ?? [];
            } elseif (preg_match('/\{.*\}/s', $text, $m)) {
                $parsed = json_decode($m[0], true) ?? [];
            } else {
                $parsed = [];
            }
        }

        \Log::channel('daily')->info('[GEMINI DEBUG] Parsed result', [
            'raw_text' => $text,
            'parsed' => $parsed,
            'tokens' => $tokens,
            'prompt_tokens' => $promptTokens,
            'candidate_tokens' => $candidateTokens,
            'request_id' => $requestId,
        ]);

        $marca = $this->cleanString($parsed['marca'] ?? null);
        $dorsal = $this->cleanDorsal($parsed['dorsal'] ?? null);
        $contexto = $this->cleanString($parsed['contexto'] ?? null, 120);
        $accion = $this->cleanAction($parsed['accion'] ?? null);

        return [
            'marca' => ($marca && strtolower($marca) !== 'n/a') ? $marca : null,
            'dorsal' => $dorsal,
            'contexto' => $contexto,
            'accion' => $accion,
            'tokens' => $tokens,
            'prompt_tokens' => $promptTokens,
            'candidate_tokens' => $candidateTokens,
            'total_tokens' => $tokens,
            'request_id' => $requestId,
            'model' => $modelToUse,
        ];
    }

    private function cleanString(mixed $value, int $maxLen = 80): ?string
    {
        if (! is_scalar($value) || blank($value)) {
            return null;
        }

        $value = (string) $value;

        return mb_substr(trim($this->sanitizeUtf8($value)), 0, $maxLen) ?: null;
    }

    private function cleanDorsal(mixed $value): ?string
    {
        if ($value === null || $value === '' || $value === '0' || $value === 0) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', (string) $value);

        return filled($digits) ? $digits : null;
    }

    private function cleanAction(mixed $value): ?string
    {
        if (! is_scalar($value) || blank($value)) {
            return null;
        }

        $value = (string) $value;
        $normalized = str_replace(' ', '_', trim(strtr($value, ['Celebración' => 'Celebracion', 'celebración' => 'celebracion'])));

        foreach (self::VALID_ACTIONS as $valid) {
            if (strcasecmp($normalized, $valid) === 0 || strcasecmp(trim($value), $valid) === 0) {
                if ($valid === 'Tiro_libre') {
                    return 'Tiro libre';
                }

                return $valid;
            }
        }

        return null;
    }

    private function sanitizeForJson(mixed $value): mixed
    {
        if (is_array($value)) {
            return collect($value)
                ->map(fn ($item) => $this->sanitizeForJson($item))
                ->all();
        }

        if (is_string($value)) {
            return $this->sanitizeUtf8($value);
        }

        return $value;
    }

    private function sanitizeUtf8(string $value): string
    {
        if (mb_check_encoding($value, 'UTF-8')) {
            return $value;
        }

        $converted = @mb_convert_encoding($value, 'UTF-8', 'UTF-8, ISO-8859-1, Windows-1252');
        if (is_string($converted) && mb_check_encoding($converted, 'UTF-8')) {
            return $converted;
        }

        return iconv('UTF-8', 'UTF-8//IGNORE', $value) ?: '';
    }

    private function resolvePhotoUrl(Photo $photo): ?string
    {
        if ($photo->gemini_path) {
            try {
                return Storage::disk('r2')->temporaryUrl($photo->gemini_path, now()->addMinutes(5));
            } catch (\Throwable) {
            }
        }

        if ($photo->optimized_path) {
            try {
                return Storage::disk('r2')->temporaryUrl($photo->optimized_path, now()->addMinutes(5));
            } catch (\Throwable) {
            }
        }

        if ($photo->url) {
            try {
                return Storage::disk('r2')->temporaryUrl($photo->url, now()->addMinutes(5));
            } catch (\Throwable) {
                return filter_var($photo->url, FILTER_VALIDATE_URL) ? $photo->url : null;
            }
        }

        return null;
    }
}

