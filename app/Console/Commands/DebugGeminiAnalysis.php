<?php

namespace App\Console\Commands;

use App\Models\Photo;
use App\Models\Project;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class DebugGeminiAnalysis extends Command
{
    protected $signature = 'debug:gemini {photo_id? : ID de la foto a analizar}';

    protected $description = 'Debug completo del análisis Gemini para una foto';

    public function handle(): int
    {
        $photoId = $this->argument('photo_id') ?? 160;

        $this->line('');
        $this->info('=== DEBUG GEMINI ANALYSIS ===');
        $this->line('');

        // 1. Config
        $apiKey = (string) config('services.gemini.api_key', '');
        $model  = (string) config('services.gemini.model', 'gemini-2.5-flash');

        $this->comment('[1] CONFIGURACIÓN');
        $this->line('  API Key   : '.($apiKey ? substr($apiKey, 0, 12).'...' : '(vacía)'));
        $this->line('  Model     : '.$model);
        $this->line('  Key OK    : '.($apiKey ? 'SI' : 'NO — falta GEMINI_API_KEY en .env'));
        $this->line('');

        if (! $apiKey) {
            $this->error('GEMINI_API_KEY no está configurada. Revisa .env');
            return 1;
        }

        // 1b. Configurar tenant R2 root (necesario en CLI, en web lo hace el middleware)
        $this->comment('[1b] TENANT R2 ROOT');
        $photo = Photo::find($photoId);
        $project = $photo ? Project::find($photo->project_id) : null;
        $tenant = $project?->tenant_id
            ? Tenant::withoutGlobalScope('tenant')->find($project->tenant_id)
            : Tenant::withoutGlobalScope('tenant')->first();
        if ($tenant?->slug) {
            config(['filesystems.disks.r2.root' => "tenants/{$tenant->slug}"]);
            Storage::forgetDisk('r2');
            $this->line("  Tenant slug : {$tenant->slug}");
            $this->line("  R2 root set : tenants/{$tenant->slug}");
        } else {
            $this->warn('  No se encontró tenant — URLs podrían fallar');
        }
        $this->line('');

        // 2. Foto
        $this->comment('[2] FOTO');
        $photo = Photo::find($photoId)  ?? $photo;

        if (! $photo) {
            $this->error("No existe la foto con ID {$photoId}");
            return 1;
        }

        $this->line("  ID          : {$photo->id}");
        $this->line("  project_id  : {$photo->project_id}");
        $this->line("  url         : ".($photo->url ?? '(null)'));
        $this->line("  optimized   : ".($photo->optimized_path ?? '(null)'));
        $this->line("  brand_tags  : ".json_encode($photo->brand_tags));
        $this->line("  jersey_num  : ".json_encode($photo->jersey_numbers));
        $this->line("  action_tags : ".json_encode($photo->action_tags));
        $this->line('');

        // 3. Resolver URL
        $this->comment('[3] RESOLVER URL DE IMAGEN');
        $imageUrl = null;

        if ($photo->optimized_path) {
            try {
                $imageUrl = Storage::disk('r2')->temporaryUrl($photo->optimized_path, now()->addMinutes(5));
                $this->line('  Origen: optimized_path → R2 temporal URL');
            } catch (\Throwable $e) {
                $this->warn('  optimized_path falló: '.$e->getMessage());
            }
        }

        if (! $imageUrl && $photo->url) {
            try {
                $imageUrl = Storage::disk('r2')->temporaryUrl($photo->url, now()->addMinutes(5));
                $this->line('  Origen: url → R2 temporal URL');
            } catch (\Throwable $e) {
                $this->warn('  url (R2 temporal) falló: '.$e->getMessage());
                if (filter_var($photo->url, FILTER_VALIDATE_URL)) {
                    $imageUrl = $photo->url;
                    $this->line('  Origen: url → directo (ya es URL pública)');
                }
            }
        }

        if (! $imageUrl) {
            $this->error('No se pudo obtener URL de la imagen.');
            return 1;
        }

        $this->line("  URL (primeros 120 chars): ".substr($imageUrl, 0, 120).'...');
        $this->line('');

        // 4. Descargar imagen
        $this->comment('[4] DESCARGA DE IMAGEN');
        $imageResponse = Http::timeout(20)->get($imageUrl);
        $this->line("  HTTP Status : {$imageResponse->status()}");
        $this->line("  Content-Type: ".($imageResponse->header('Content-Type') ?: '(vacío)'));
        $this->line("  Tamaño bytes: ".strlen($imageResponse->body()));

        if (! $imageResponse->successful()) {
            $this->error('Descarga falló con status '.$imageResponse->status());
            $this->line($imageResponse->body());
            return 1;
        }

        $base64   = base64_encode($imageResponse->body());
        $mimeType = explode(';', $imageResponse->header('Content-Type') ?: 'image/jpeg')[0];
        $this->line("  MIME usado  : {$mimeType}");
        $this->line("  Base64 len  : ".strlen($base64).' chars');
        $this->line('');

        // 5. Llamada a Gemini
        $this->comment('[5] LLAMADA A GEMINI');
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
        $this->line("  Endpoint: https://.../{$model}:generateContent?key=***");

        $systemInstruction = 'Analiza la imagen deportiva. Responde únicamente en formato JSON siguiendo estrictamente estas reglas de brevedad para ahorrar tokens: marca: Solo el nombre de la marca de la camiseta (Ej: "Nike"). Si no hay, "N/A". dorsal: Solo el número visible como string. Si no hay, "0". contexto: Descripción técnica en máximo 60 caracteres (Ej: "Delantero rematando de cabeza en área pequeña"). accion: Una sola palabra de esta lista: [Gol, Falta, Penal, Tiro_libre, Disputa, Celebración, Atajada, Otro]. Restricción: No incluyas prosas, saludos ni explicaciones. Solo el objeto JSON.';

        $payload = [
            'system_instruction' => ['parts' => [['text' => $systemInstruction]]],
            'contents' => [[
                'parts' => [
                    ['inlineData' => ['mimeType' => $mimeType, 'data' => $base64]],
                ],
            ]],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'maxOutputTokens'  => 150,
                'temperature'      => 0.1,
            ],
        ];

        $this->line('  Enviando request...');
        $start    = microtime(true);
        $response = Http::timeout(30)->post($endpoint, $payload);
        $elapsed  = round((microtime(true) - $start) * 1000);

        $this->line("  HTTP Status : {$response->status()} ({$elapsed}ms)");
        $this->line('');

        // 6. Respuesta raw
        $this->comment('[6] RESPUESTA RAW DE GEMINI');
        $body = $response->body();
        $this->line(substr($body, 0, 2000));
        $this->line('');

        if (! $response->successful()) {
            $this->error('Gemini devolvió error '.$response->status());
            return 1;
        }

        // 7. Parseo
        $this->comment('[7] PARSEO DEL RESULTADO');
        $data = $response->json();
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '(sin texto)';
        $this->line("  Text raw    : {$text}");

        $parsed = json_decode($text, true) ?? [];
        $this->line("  Parsed JSON : ".json_encode($parsed, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        $tokens = $data['usageMetadata']['totalTokenCount'] ?? null;
        $this->line("  Tokens usados: {$tokens}");
        $this->line('');

        // 8. Valores extraídos
        $this->comment('[8] VALORES EXTRAÍDOS');
        $marca   = isset($parsed['marca'])   ? trim((string) $parsed['marca'])   : null;
        $dorsal  = isset($parsed['dorsal'])  ? trim((string) $parsed['dorsal'])  : null;
        $contexto= isset($parsed['contexto'])? trim((string) $parsed['contexto']): null;
        $accion  = isset($parsed['accion'])  ? trim((string) $parsed['accion'])  : null;

        $marcaFinal  = ($marca && strtolower($marca) !== 'n/a') ? $marca : null;
        $dorsalFinal = ($dorsal && $dorsal !== '0') ? preg_replace('/\D+/', '', $dorsal) : null;

        $this->line("  marca    raw=".json_encode($marca)."  final=".json_encode($marcaFinal));
        $this->line("  dorsal   raw=".json_encode($dorsal)."  final=".json_encode($dorsalFinal));
        $this->line("  contexto raw=".json_encode($contexto));
        $this->line("  accion   raw=".json_encode($accion));
        $this->line('');

        // 9. Qué se guardaría
        $this->comment('[9] QUÉ SE GUARDARÍA EN LA FOTO');
        $update = [];

        if ($marcaFinal) {
            $update['brand_tags'] = collect($photo->brand_tags ?? [])->push($marcaFinal)->unique()->values()->all();
            $this->line("  brand_tags  → ".json_encode($update['brand_tags']));
        } else {
            $this->warn('  brand_tags  → NO SE GUARDA (marca nula o N/A)');
        }

        if ($dorsalFinal) {
            $update['jersey_numbers'] = collect($photo->jersey_numbers ?? [])->push($dorsalFinal)->unique()->values()->all();
            $this->line("  jersey_nums → ".json_encode($update['jersey_numbers']));
        } else {
            $this->warn('  jersey_nums → NO SE GUARDA (dorsal nulo o 0)');
        }

        if ($contexto) {
            $this->line("  context_tags → ".json_encode($contexto));
        } else {
            $this->warn('  context_tags → NO SE GUARDA');
        }

        if ($accion) {
            $this->line("  action_tags → ".json_encode($accion));
        } else {
            $this->warn('  action_tags → NO SE GUARDA (accion nula o no válida)');
        }

        if (empty($update)) {
            $this->newLine();
            $this->error('⚠  NO HAY NADA QUE GUARDAR — Gemini respondió pero todos los valores quedaron nulos/default.');
        } else {
            $this->newLine();
            $this->info('✓  Se guardarían '.count($update).' campo(s) en la foto.');
        }

        $this->line('');
        $this->info('=== FIN DEBUG ===');

        return 0;
    }
}
