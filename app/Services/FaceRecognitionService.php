<?php

namespace App\Services;

use App\Jobs\DispatchFaceRecognitionTaskJob;
use App\Models\FaceIdentity;
use App\Models\FaceIdentityVector;
use App\Models\FaceUnknownDetection;
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
        return filled($this->identityTaskQueueName()) && filled($this->recognizeTaskQueueName()) && filled($this->resultQueueName());
    }

    public function healthCheck(): array
    {
        if (! $this->enabled()) {
            throw new \RuntimeException('Las colas del motor IA no estan configuradas.');
        }

        Redis::connection($this->redisConnection())->client()->ping();

        return [
            'status' => 'ok',
            'driver' => 'redis',
            'identity_task_queue' => $this->identityTaskQueueName(),
            'recognize_task_queue' => $this->recognizeTaskQueueName(),
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
        $photoIds = $project->photos()->pluck('id')->all();

        if ($project->supportsSponsorDetection() && $project->hasSelectedSponsors()) {
            foreach (array_chunk($photoIds, 4) as $chunk) {
                DispatchFaceRecognitionTaskJob::dispatch('recognize_batch', $project->id, null, null, $chunk);
            }

            return count($photoIds);
        }

        foreach ($photoIds as $photoId) {
            DispatchFaceRecognitionTaskJob::dispatch('recognize_photo', $project->id, $photoId, null);
        }

        return count($photoIds);
    }

    public function enqueueIdentityExtraction(?Project $project, FaceIdentity $identity): void
    {
        $tenant = $this->resolveTenantForIdentity($project, $identity);
        $imageUrl = $this->temporaryUrlForReferencePath($identity->path_reference);

        if (! $imageUrl) {
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
        ], $this->identityTaskQueueName());
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

        if ($tenant && ! $tenant->canConsumeScan()) {
            $photo->update([
                'recognition_status' => 'error',
                'recognition_note' => 'Has alcanzado el limite mensual de fotos procesadas por tu plan.',
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
            'ai_image_url' => $imageUrl,
            'filename' => basename($optimizedPath),
            'tolerance' => (float) config('services.face_ai.tolerance', 0.6),
            'database' => $identities->map(fn (FaceIdentity $identity) => $this->buildIdentityPayload($identity))->values()->all(),
            'sponsor_keywords' => $this->selectedSponsors($project),
            'supports_sponsors' => $project->supportsSponsorDetection(),
        ], $this->recognizeTaskQueueName());
    }

    public function enqueueBatchRecognition(Project $project, array $photoIds): void
    {
        $tenant = $this->resolveTenant($project);
        $identities = $this->recognitionIdentities($project);
        $photos = Photo::withoutGlobalScope('tenant')
            ->whereIn('id', $photoIds)
            ->where('project_id', $project->id)
            ->orderBy('id')
            ->get();

        if ($photos->isEmpty()) {
            return;
        }

        if ($identities->isEmpty()) {
            $photos->each(fn (Photo $photo) => $photo->update([
                'recognition_status' => 'error',
                'recognition_note' => 'No hay personas de referencia listas para comparar.',
                'recognition_processed_at' => now(),
            ]));
            return;
        }

        if ($tenant && ! $tenant->canConsumeScan($photos->count())) {
            $photos->each(fn (Photo $photo) => $photo->update([
                'recognition_status' => 'error',
                'recognition_note' => 'Has alcanzado el limite mensual de fotos procesadas por tu plan.',
                'recognition_processed_at' => now(),
            ]));
            return;
        }

        $payloadPhotos = $photos->map(function (Photo $photo) use ($project) {
            $optimizedPath = $this->ensureOptimizedPhotoPath($project, $photo);
            $imageUrl = $this->temporaryUrlForR2Path($optimizedPath);

            $photo->update([
                'recognition_status' => 'pending',
                'recognition_note' => 'Foto enviada a cola para procesamiento IA por mosaico.',
                'recognition_processed_at' => null,
            ]);

            return [
                'photo_id' => $photo->id,
                'image_url' => $imageUrl,
                'ai_image_url' => $imageUrl,
                'filename' => basename($optimizedPath),
            ];
        })->values()->all();

        if ($tenant) {
            $tenant->incrementScanCount(count($payloadPhotos));
        }

        $this->pushTask([
            'task_type' => 'recognize_batch',
            'tenant_id' => $tenant?->id,
            'project_id' => $project->id,
            'photos' => $payloadPhotos,
            'tolerance' => (float) config('services.face_ai.tolerance', 0.6),
            'database' => $identities->map(fn (FaceIdentity $identity) => $this->buildIdentityPayload($identity))->values()->all(),
            'sponsor_keywords' => $this->selectedSponsors($project),
            'supports_sponsors' => $project->supportsSponsorDetection(),
        ], $this->recognizeTaskQueueName());
    }

    public function popNextResult(int $timeout = 5): ?array
    {
        $payload = Redis::connection($this->redisConnection())->blpop($this->resultQueueName(), max(1, $timeout));

        if (! $payload) {
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
            return;
        }

        if ($taskType === 'recognize_batch') {
            foreach ($message['results'] ?? [] as $result) {
                if (is_array($result)) {
                    $this->processPhotoResult($result + ['task_type' => 'recognize_photo']);
                }
            }
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
        ?string $error = null,
        ?int $geminiTokens = null,
        ?string $geminiRequestId = null,
        ?int $geminiBatchSize = null
    ): void {
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
        } elseif (! empty($people)) {
            $status = 'matched';
            $note = 'Coincidencias detectadas: '.implode(', ', $people).'.';
        } else {
            $status = 'no_match';
            $note = 'Se analizo la foto pero no hubo coincidencias con las personas registradas.';
        }

        $update = [
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
        ];

        if ($geminiTokens !== null && $geminiTokens >= 0) {
            $update['gemini_tokens'] = $geminiTokens;
        }

        if ($geminiRequestId) {
            $update['gemini_request_id'] = $geminiRequestId;
        }

        if ($geminiBatchSize !== null) {
            $update['gemini_batch_size'] = $geminiBatchSize;
        }

        $photo->update($update);
    }

    private function processIdentityResult(array $message): void
    {
        $identityId = (int) ($message['face_identity_id'] ?? 0);
        $identity = FaceIdentity::withoutGlobalScope('tenant')->find($identityId);

        if (! $identity) {
            return;
        }

        $vector = $message['vector'] ?? null;
        $error = trim((string) ($message['error'] ?? ''));

        if (is_array($vector) && ! empty($vector)) {
            $identity->update([
                'embedding' => $vector,
                'processing_status' => 'ready',
                'processing_note' => 'Embedding generado correctamente.',
                'processed_at' => now(),
            ]);

            // Save as primary vector in the multi-vector table
            FaceIdentityVector::where('face_identity_id', $identity->id)
                ->where('is_primary', true)
                ->delete();

            FaceIdentityVector::create([
                'face_identity_id' => $identity->id,
                'tenant_id' => $identity->tenant_id,
                'embedding' => $vector,
                'source_type' => 'manual_upload',
                'is_primary' => true,
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

        if (! $photo) {
            return;
        }

        $people = collect($message['matches'] ?? [])
            ->pluck('name')
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->values()
            ->all();

        $this->applyRecognitionResult(
            $photo,
            $people,
            collect($message['brands'] ?? [])->map(fn ($value) => trim((string) $value))->filter()->values()->all(),
            collect($message['jersey_numbers'] ?? [])->map(fn ($value) => trim((string) $value))->filter()->values()->all(),
            collect($message['sponsors'] ?? [])->map(fn ($value) => trim((string) $value))->filter()->values()->all(),
            collect($message['context_tags'] ?? [])->map(fn ($value) => trim((string) $value))->filter()->values()->all(),
            collect($message['action_tags'] ?? [])->map(fn ($value) => trim((string) $value))->filter()->values()->all(),
            isset($message['faces_detected']) ? (int) $message['faces_detected'] : null,
            $message['error'] ?? null,
            isset($message['gemini_tokens']) ? (int) $message['gemini_tokens'] : null,
            $message['gemini_request_id'] ?? null,
            isset($message['gemini_batch_size']) ? (int) $message['gemini_batch_size'] : null,
        );

        $this->saveUnknownDetections($photo, $message['unknown_faces'] ?? []);
    }

    private function saveUnknownDetections(Photo $photo, array $unknownFaces): void
    {
        if (empty($unknownFaces)) {
            return;
        }

        // Replace previous unknown detections for this photo
        FaceUnknownDetection::withoutGlobalScope('tenant')
            ->where('photo_id', $photo->id)
            ->where('status', 'unknown')
            ->delete();

        foreach ($unknownFaces as $face) {
            $embedding = $face['embedding'] ?? null;
            if (! is_array($embedding) || empty($embedding)) {
                continue;
            }

            FaceUnknownDetection::create([
                'tenant_id' => $photo->tenant_id,
                'photo_id' => $photo->id,
                'face_index' => (int) ($face['face_index'] ?? 0),
                'embedding' => $embedding,
                'bbox' => $face['bbox'] ?? null,
                'best_confidence' => isset($face['best_confidence']) ? (float) $face['best_confidence'] : null,
                'best_match_identity_id' => $face['best_match_identity_id'] ?? null,
                'status' => 'unknown',
            ]);
        }
    }

    public function confirmUnknownDetection(FaceUnknownDetection $detection, FaceIdentity $identity): void
    {
        FaceIdentityVector::create([
            'face_identity_id' => $identity->id,
            'tenant_id' => $identity->tenant_id,
            'embedding' => $detection->embedding,
            'source_type' => 'confirmed_match',
            'is_primary' => false,
            'confidence' => $detection->best_confidence,
        ]);

        $detection->update([
            'status' => 'confirmed',
            'best_match_identity_id' => $identity->id,
        ]);
    }

    private function buildIdentityPayload(FaceIdentity $identity): array
    {
        $vectors = $identity->vectors->map(fn (FaceIdentityVector $v) => [
            'vector_id' => $v->id,
            'embedding' => $v->embedding,
        ])->values()->all();

        // Fall back to legacy single embedding if no vectors in new table
        if (empty($vectors) && $identity->embedding) {
            return [
                'id' => $identity->id,
                'name' => $identity->name,
                'vector' => $identity->embedding,
            ];
        }

        return [
            'id' => $identity->id,
            'name' => $identity->name,
            'vectors' => $vectors,
        ];
    }

    private function selectedSponsors(Project $project): array
    {
        if (! $project->supportsSponsorDetection()) {
            return [];
        }

        return $project->selectedSponsors();
    }

    private function pushTask(array $payload, string $queue): void
    {
        Redis::connection($this->redisConnection())->rpush($queue, json_encode($payload, JSON_UNESCAPED_SLASHES));
    }

    private function redisConnection(): string
    {
        return (string) config('services.face_ai.redis_connection', 'default');
    }

    private function identityTaskQueueName(): string
    {
        return (string) config('services.face_ai.identity_task_queue', 'face-ai:tasks:identity');
    }

    private function recognizeTaskQueueName(): string
    {
        return (string) config('services.face_ai.recognize_task_queue', 'face-ai:tasks:recognize');
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
            ->with(['vectors' => fn ($q) => $q->select(['id', 'face_identity_id', 'embedding'])])
            ->where('tenant_id', $project->tenant_id)
            ->where(function ($query) use ($project) {
                $query->whereNull('project_id')
                    ->orWhere('project_id', $project->id);
            })
            ->where(function ($query) {
                // Include identities with vectors in the new table OR legacy embedding
                $query->whereHas('vectors')
                    ->orWhereNotNull('embedding');
            })
            ->get(['id', 'name', 'embedding', 'project_id', 'tenant_id']);
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

        if (! $sourcePath || ! Storage::disk('r2')->exists($sourcePath)) {
            throw new \RuntimeException('No existe archivo base para generar la version optimizada.');
        }

        $tempDir = storage_path('app/tmp/face-ai');
        if (! is_dir($tempDir)) {
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

        if (! $image) {
            copy($originalPath, $optimizedPath);
            return;
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $maxDimension = 2000;

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

        $quality = 82;
        imagewebp($image, $optimizedPath, $quality);

        while (@filesize($optimizedPath) > 800 * 1024 && $quality > 50) {
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

        try {
            return $this->temporaryUrlForR2Path($path);
        } catch (\Throwable $e) {
        }

        try {
            if (Storage::disk('public')->exists($path)) {
                return url(Storage::disk('public')->url($path));
            }
        } catch (\Throwable $e) {
        }

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
