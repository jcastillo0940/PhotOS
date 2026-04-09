<?php

namespace App\Services;

use App\Models\FaceIdentity;
use App\Models\Photo;
use App\Models\Project;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FaceRecognitionService
{
    public function enabled(): bool
    {
        return filled($this->baseUrl());
    }

    public function healthCheck(): array
    {
        if (!$this->enabled()) {
            throw new \RuntimeException('FACE_AI_SERVICE_URL no esta configurado.');
        }

        $response = $this->client()->get('/health');

        if (!$response->successful()) {
            throw new \RuntimeException('El servicio IA no respondio correctamente.');
        }

        return $response->json();
    }

    public function extractIdentityEmbedding(Project $project, string $absolutePath, string $filename): array
    {
        $response = $this->client()
            ->attach('file', fopen($absolutePath, 'r'), $filename)
            ->post('/extract-face');

        if (!$response->successful()) {
            throw new \RuntimeException($this->responseErrorMessage($response, 'No se pudo extraer el rostro de referencia.'));
        }

        $vector = $response->json('vector');

        if (!is_array($vector) || count($vector) === 0) {
            throw new \RuntimeException('El servicio no devolvio un vector valido.');
        }

        return $vector;
    }

    public function identifyPhoto(Project $project, Photo $photo): array
    {
        $identities = $project->faceIdentities()
            ->whereNotNull('embedding')
            ->get(['id', 'name', 'embedding']);

        if ($identities->isEmpty()) {
            return [];
        }

        $absolutePath = $this->photoAbsolutePath($photo);
        $filename = basename($absolutePath);

        $database = $identities->map(fn (FaceIdentity $identity) => [
            'id' => $identity->id,
            'vector' => $identity->embedding,
        ])->values()->all();

        $response = $this->client()
            ->attach('file', fopen($absolutePath, 'r'), $filename)
            ->post('/compare-faces', [
                'database' => json_encode($database),
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException($this->responseErrorMessage($response, 'No se pudo comparar la foto contra las personas registradas.'));
        }

        $foundIds = collect($response->json('found_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->values();

        if ($foundIds->isEmpty()) {
            return [];
        }

        return $identities
            ->whereIn('id', $foundIds->all())
            ->pluck('name')
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    public function identifyProject(Project $project): array
    {
        $results = [];

        foreach ($project->photos as $photo) {
            try {
                $people = $this->identifyPhoto($project, $photo);
                $results[] = [
                    'photo_id' => $photo->id,
                    'people_tags' => $people,
                    'status' => empty($people) ? 'no_match' : 'matched',
                ];
            } catch (\Throwable $e) {
                $results[] = [
                    'photo_id' => $photo->id,
                    'error' => $e->getMessage(),
                    'status' => str_contains(mb_strtolower($e->getMessage()), 'ningun rostro') ? 'no_face' : 'error',
                ];
            }
        }

        return $results;
    }

    private function responseErrorMessage(Response $response, string $fallback): string
    {
        $json = $response->json();

        if (is_array($json)) {
            $detail = $json['detail'] ?? null;

            if (is_string($detail) && filled($detail)) {
                return $detail;
            }

            if (is_array($detail) && isset($detail[0]['msg']) && is_string($detail[0]['msg'])) {
                return $detail[0]['msg'];
            }

            $error = $json['error'] ?? null;

            if (is_string($error) && filled($error)) {
                return $error;
            }
        }

        return $fallback;
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl())
            ->timeout(120)
            ->acceptJson();
    }

    private function baseUrl(): ?string
    {
        return rtrim((string) config('services.face_ai.url'), '/');
    }

    private function photoAbsolutePath(Photo $photo): string
    {
        $relativePath = $photo->original_path ?: $photo->optimized_path ?: $photo->url;

        if (!$relativePath) {
            throw new \RuntimeException('La foto no tiene un archivo asociado para analisis.');
        }

        if (Str::startsWith($relativePath, ['http://', 'https://'])) {
            $tmpDirectory = storage_path('app/tmp/face-ai');

            if (!is_dir($tmpDirectory)) {
                mkdir($tmpDirectory, 0755, true);
            }

            $tmpPath = $tmpDirectory.'/'.uniqid('face-photo_', true).'.jpg';
            file_put_contents($tmpPath, file_get_contents($relativePath));

            return $tmpPath;
        }

        if (filled($photo->original_path)) {
            return $this->downloadFromR2($photo->original_path, 'original');
        }

        return $this->downloadFromR2($photo->optimized_path, 'web');
    }

    private function downloadFromR2(string $path, string $prefix): string
    {
        $tmpDirectory = storage_path('app/tmp/face-ai');

        if (!is_dir($tmpDirectory)) {
            mkdir($tmpDirectory, 0755, true);
        }

        $extension = pathinfo($path, PATHINFO_EXTENSION) ?: 'jpg';
        $tmpPath = $tmpDirectory.'/'.uniqid("{$prefix}_", true).'.'.$extension;
        file_put_contents($tmpPath, Storage::disk('r2')->get($path));

        return $tmpPath;
    }
}
