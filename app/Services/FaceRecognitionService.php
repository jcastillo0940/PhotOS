<?php

namespace App\Services;

use App\Jobs\DispatchFaceRecognitionTaskJob;
use App\Models\FaceIdentity;
use App\Models\Photo;
use App\Models\Project;
use App\Models\Setting;
use App\Models\Tenant;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FaceRecognitionService
{
    public function enabled(): bool
    {
        return filled($this->taskQueueName()) && filled($this->resultQueueName());
    }

    public function healthCheck(): array
    {
        if (!$this->enabled()) {
            throw new \RuntimeException('La cola del motor IA no esta configurada.');
        }

        Redis::connection($this->redisConnection())->client()->ping();

        return [
            'status' => 'ok',
            'driver' => 'redis',
            'task_queue' => $this->taskQueueName(),
            'result_queue' => $this->resultQueueName(),
            'tolerance' => (float) config('services.face_ai.tolerance', 0.6),
        ];
    }

    public function dispatchIdentityExtraction(Project $project, FaceIdentity $identity): void
    {
        DispatchFaceRecognitionTaskJob::dispatch('extract_identity', $project->id, null, $identity->id);
    }

    public function dispatchTenantIdentityExtraction(FaceIdentity $identity): void
    {
        DispatchFaceRecognitionTaskJob::dispatch('extract_identity', $identity->project_id, null, $identity->id);
    }

    public function dispatchPhotoRecognition(Project $project, Photo $photo): void
    {
        DispatchFaceRecognitionTaskJob::dispatch('recognize_photo', $project->id, $photo->id, null);
    }

    public function dispatchProjectRecognition(Project $project): int
    {
        $photos = $project->photos()->get(['id']);

        foreach ($photos as $photo) {
            DispatchFaceRecognitionTaskJob::dispatch('recognize_photo', $project->id, $photo->id, null);
        }

        return $photos->count();
    }

    public function enqueueIdentityExtraction(?Project $project, FaceIdentity $identity): void
    {
        $tenant = $this->resolveTenantForIdentity($project, $identity);
        $imageUrl = $this->temporaryUrlForReferencePath($identity->path_reference);

        if (!$imageUrl) {
            $identity->update([
                'processing_status' => 'error',
                'processing_note' => 'No se encontro la imagen de referencia para procesar.',
                'processed_at' => now(),
            ]);

            return;
        }

        $identity->update([
            'processing_status' => 'queued',
            'processing_note' => 'Enviado a cola para extraer embedding.',
            'processed_at' => null,
        ]);

        $this->pushTask([
            'task_type' => 'extract_identity',
            'tenant_id' => $tenant?->id,
            'project_id' => $project?->id,
            'face_identity_id' => $identity->id,
            'image_url' => $imageUrl,

            'filename' => basename((string) $identity->path_reference),
        ]);
    }

    public function enqueuePhotoRecognition(Project $project, Photo $photo): void
    {
        $tenant = $this->resolveTenant($project);
        $identities = $this->recognitionIdentities($project);

        if ($identities->isEmpty()) {
            $photo->update([
                'recognition_status' => 'error',
                'recognition_note' => 'No hay personas de referencia listas para comparar.',
                'recognition_processed_at' => now(),
            ]);

            return;
        }

        if ($tenant && !$tenant->canConsumeScan()) {
            $photo->update([
                'recognition_status' => 'error',
                'recognition_note' => 'Has alcanzado el limite mensual de escaneos IA de tu plan.',
                'recognition_processed_at' => now(),
            ]);
            return;
        }

        $optimizedPath = $this->ensureOptimizedPhotoPath($project, $photo);
        $imageUrl = $this->temporaryUrlForR2Path($optimizedPath);

        $photo->update([
            'recognition_status' => 'pending',
            'recognition_note' => 'Foto enviada a cola para reconocimiento facial.',
            'recognition_processed_at' => null,
        ]);

        if ($tenant) {
            $tenant->incrementScanCount(1);
        }

        $this->pushTask([
            'task_type' => 'recognize_photo',
            'tenant_id' => $tenant?->id,
            'project_id' => $project?->id,
            'photo_id' => $photo->id,
            'image_url' => $imageUrl,

            'tolerance' => (float) config('services.face_ai.tolerance', 0.6),
            'database' => $identities->map(fn (FaceIdentity $identity) => [
                'id' => $identity->id,
                'name' => $identity->name,
                'vector' => $identity->embedding,
            ])->values()->all(),

            'brand_keywords'   => $this->catalogKeywords('ai_brand_catalog'),
            'sponsor_keywords' => $this->catalogKeywords('ai_sponsor_catalog'),
            'jersey_keywords'  => $this->catalogKeywords('ai_jersey_catalog'),
            'context_keywords' => $this->catalogKeywords('ai_context_catalog'),
        ]);
    }

    public function popNextResult(int $timeout = 5): ?array
    {
        $payload = Redis::connection($this->redisConnection())->blpop($this->resultQueueName(), max(1, $timeout));

        if (!$payload) {
            return null;
        }

        $message = is_array($payload) ? Arr::last($payload) : $payload;
        $decoded = json_decode((string) $message, true);

        return is_array($decoded) ? $decoded : null;
    }

    public function processWorkerResult(array $message): void
    {
        $taskType = (string) ($message['task_type'] ?? '');

        if ($taskType === 'extract_identity') {
            $this->processIdentityResult($message);
            return;
        }

        if ($taskType === 'recognize_photo') {
            $this->processPhotoResult($message);
        }
    }

    public function applyRecognitionResult(
        Photo $photo,
        array $people,
        array $brands = [],
        array $jerseyNumbers = [],
        array $sponsors = [],
        array $contextTags = [],
        array $actionTags = [],
        ?int $facesDetected = null,
        ?string $error = null
    ): void
    {
        $people = collect($people)->map(fn ($name) => trim((string) $name))->filter()->unique()->values()->all();
        $brands = collect($brands)->map(fn ($name) => trim((string) $name))->filter()->unique()->values()->all();
        $jerseyNumbers = collect($jerseyNumbers)->map(fn ($value) => trim((string) $value))->filter()->unique()->values()->all();
        $sponsors = collect($sponsors)->map(fn ($value) => trim((string) $value))->filter()->unique()->values()->all();
        $contextTags = collect($contextTags)->map(fn ($value) => trim((string) $value))->filter()->unique()->values()->all();
        $actionTags = collect($actionTags)->map(fn ($value) => trim((string) $value))->filter()->unique()->values()->all();
        $peopleCount = $facesDetected !== null ? max(0, (int) $facesDetected) : count($people);
        $peopleCountLabel = $this->peopleCountLabel($peopleCount);
        $shotType = $this->shotType($peopleCount);

        if ($error) {
            $status = str_contains(mb_strtolower($error), 'ningun rostro') ? 'no_face' : 'error';
            $note = $error;
        } elseif (!empty($people)) {
            $status = 'matched';
            $note = 'Coincidencias detectadas: '.implode(', ', $people).'.';
        } else {
            $status = 'no_match';
            $note = 'Se analizo la foto pero no hubo coincidencias con las personas registradas.';
        }

        $photo->update([
            'people_tags' => $people,
            'brand_tags' => $brands,
            'jersey_numbers' => $jerseyNumbers,
            'sponsor_tags' => $sponsors,
            'context_tags' => $contextTags,
            'action_tags' => $actionTags,
            'people_count' => $peopleCount,
            'people_count_label' => $peopleCountLabel,
            'shot_type' => $shotType,
            'recognition_status' => $status,
            'recognition_note' => $note,
            'recognition_processed_at' => now(),
        ]);
    }

    private function processIdentityResult(array $message): void
    {
        $identityId = (int) ($message['face_identity_id'] ?? 0);
        $identity = FaceIdentity::withoutGlobalScope('tenant')->find($identityId);

        if (!$identity) {
            return;
        }

        $vector = $message['vector'] ?? null;
        $error = trim((string) ($message['error'] ?? ''));

        if (is_array($vector) && !empty($vector)) {
            $identity->update([
                'embedding' => $vector,
                'processing_status' => 'ready',
                'processing_note' => 'Embedding generado correctamente.',
                'processed_at' => now(),
            ]);

            return;
        }

        $identity->update([
            'processing_status' => 'error',
            'processing_note' => $error ?: 'El worker no devolvio un embedding valido.',
            'processed_at' => now(),
        ]);
    }

    private function processPhotoResult(array $message): void
    {
        $photoId = (int) ($message['photo_id'] ?? 0);
        $photo = Photo::withoutGlobalScope('tenant')->find($photoId);

        if (!$photo) {
            return;
        }

        $people = collect($message['matches'] ?? [])
            ->pluck('name')
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->values()
            ->all();

        $brands = collect($message['brands'] ?? [])
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->values()
            ->all();
        $jerseyNumbers = collect($message['jersey_numbers'] ?? [])
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->values()
            ->all();
        $sponsors = collect($message['sponsors'] ?? [])
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->values()
            ->all();
        $contextTags = collect($message['context_tags'] ?? [])
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->values()
            ->all();

        $actionTags = collect($message['action_tags'] ?? [])
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->values()
            ->all();

        $this->applyRecognitionResult(
            $photo,
            $people,
            $brands,
            $jerseyNumbers,
            $sponsors,
            $contextTags,
            $actionTags,
            isset($message['faces_detected']) ? (int) $message['faces_detected'] : null,
            $message['error'] ?? null
        );
    }

    private function catalogKeywords(string $settingKey): array
    {
        try {
            $raw = Setting::withoutGlobalScope('tenant')
                ->whereNull('tenant_id')
                ->where('key', $settingKey)
                ->value('value');

            $items = json_decode((string) ($raw ?? '[]'), true);

            if (! is_array($items)) {
                return [];
            }

            return collect($items)
                ->pluck('name')
                ->filter()
                ->map(fn ($name) => strtolower(trim((string) $name)))
                ->unique()
                ->values()
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function pushTask(array $payload): void
    {
        Redis::connection($this->redisConnection())->rpush($this->taskQueueName(), json_encode($payload, JSON_UNESCAPED_SLASHES));
    }

    private function redisConnection(): string
    {
        return (string) config('services.face_ai.redis_connection', 'default');
    }

    private function taskQueueName(): string
    {
        return (string) config('services.face_ai.task_queue', 'face-ai:tasks');
    }

    private function resultQueueName(): string
    {
        return (string) config('services.face_ai.result_queue', 'face-ai:results');
    }

    private function resolveTenant(Project $project): ?Tenant
    {
        return $project->tenant_id ? Tenant::withoutGlobalScope('tenant')->find($project->tenant_id) : null;
    }

    private function resolveTenantForIdentity(?Project $project, FaceIdentity $identity): ?Tenant
    {
        if ($project) {
            return $this->resolveTenant($project);
        }

        return $identity->tenant_id
            ? Tenant::withoutGlobalScope('tenant')->find($identity->tenant_id)
            : null;
    }

    public function recognitionIdentities(Project $project)
    {
        return FaceIdentity::withoutGlobalScope('tenant')
            ->where('tenant_id', $project->tenant_id)
            ->whereNotNull('embedding')
            ->where(function ($query) use ($project) {
                $query->whereNull('project_id')
                    ->orWhere('project_id', $project->id);
            })
            ->get(['id', 'name', 'embedding', 'project_id']);
    }

    public function hasRecognitionDatabase(Project $project): bool
    {
        return $this->recognitionIdentities($project)->isNotEmpty();
    }

    private function ensureOptimizedPhotoPath(Project $project, Photo $photo): string
    {
        if (filled($photo->optimized_path) && Storage::disk('r2')->exists($photo->optimized_path)) {
            return $photo->optimized_path;
        }

        $sourcePath = $photo->original_path ?: $photo->optimized_path;

        if (!$sourcePath || !Storage::disk('r2')->exists($sourcePath)) {
            throw new \RuntimeException('No existe archivo base para generar la version optimizada.');
        }

        $tempDir = storage_path('app/tmp/face-ai');
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $sourceExtension = pathinfo($sourcePath, PATHINFO_EXTENSION) ?: 'jpg';
        $localSource = $tempDir.'/'.uniqid('source_', true).'.'.$sourceExtension;
        $localOptimized = $tempDir.'/'.uniqid('optimized_', true).'.webp';

        try {
            file_put_contents($localSource, Storage::disk('r2')->get($sourcePath));
            $this->createOptimizedWebp($localSource, $localOptimized);

            $baseName = pathinfo($photo->original_path ?: $photo->optimized_path ?: ('photo-'.$photo->id), PATHINFO_FILENAME);
            $optimizedPath = $project->webBucketPrefix().'/'.$baseName.'.webp';

            Storage::disk('r2')->put($optimizedPath, fopen($localOptimized, 'r'), [
                'ContentType' => 'image/webp',
            ]);

            $photo->update([
                'optimized_path' => $optimizedPath,
                'url' => $optimizedPath,
                'thumbnail_url' => $optimizedPath,
                'optimized_bytes' => @filesize($localOptimized) ?: null,
            ]);

            return $optimizedPath;
        } finally {
            if (file_exists($localSource)) {
                @unlink($localSource);
            }

            if (file_exists($localOptimized)) {
                @unlink($localOptimized);
            }
        }
    }

    private function createOptimizedWebp(string $originalPath, string $optimizedPath): void
    {
        $imageInfo = @getimagesize($originalPath);
        $image = null;

        if ($imageInfo) {
            if ($imageInfo['mime'] === 'image/jpeg') {
                $image = @imagecreatefromjpeg($originalPath);
            } elseif ($imageInfo['mime'] === 'image/png') {
                $image = @imagecreatefrompng($originalPath);
            } elseif ($imageInfo['mime'] === 'image/webp') {
                $image = @imagecreatefromwebp($originalPath);
            }
        }

        if (!$image) {
            copy($originalPath, $optimizedPath);
            return;
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $maxDimension = 2200;

        if ($width > $maxDimension || $height > $maxDimension) {
            $ratio = min($maxDimension / $width, $maxDimension / $height);
            $newWidth = max(1, (int) round($width * $ratio));
            $newHeight = max(1, (int) round($height * $ratio));

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resized;
        }

        $quality = 78;
        imagewebp($image, $optimizedPath, $quality);

        while (@filesize($optimizedPath) > 500 * 1024 && $quality > 50) {
            $quality -= 5;
            imagewebp($image, $optimizedPath, $quality);
        }

        imagedestroy($image);
    }

    private function temporaryUrlForR2Path(string $path): string
    {
        return Storage::disk('r2')->temporaryUrl($path, now()->addMinutes(20));
    }

    private function temporaryUrlForReferencePath(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }
        // Favor R2 as primary storage and avoid a mandatory exists() check when signing URLs
        try {
            return $this->temporaryUrlForR2Path($path);
        } catch (\Throwable $e) {
            // Fall through to other disks if R2 fails (e.g. credentials not set)
        }

        try {
            if (Storage::disk('public')->exists($path)) {
                return url(Storage::disk('public')->url($path));
            }
        } catch (\Throwable $e) {}

        return null;
    }

    private function peopleCountLabel(int $count): string
    {
        return match (true) {
            $count <= 0 => '0 personas',
            $count === 1 => '1 persona',
            $count === 2 => '2 personas',
            $count === 3 => '3 personas',
            default => '4 o mas personas',
        };
    }

    private function shotType(int $count): string
    {
        return match (true) {
            $count <= 1 => 'jugador_en_solitario',
            $count === 2 => 'duelo',
            $count >= 11 => 'foto_de_equipo',
            default => 'grupo',
        };
    }
}
