<?php

namespace App\Services;

use App\Jobs\DispatchFaceRecognitionTaskJob;
use App\Models\Photo;
use App\Models\Project;
use App\Models\Setting;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProjectPhotoUploadService
{
    public function __construct(
        private readonly CrmAutomationService $automationService,
        private readonly TenantContext $tenantContext,
        private readonly FaceRecognitionService $faceRecognitionService,
    ) {}

    public function upload(Request $request, Project $project): void
    {
        set_time_limit(0);

        $uploadId = uniqid('upload_');
        $memBefore = memory_get_usage(true);

        Log::channel('single')->info("[UPLOAD:{$uploadId}] === INICIO UPLOAD proyecto={$project->id} ===", [
            'memory_limit' => ini_get('memory_limit'),
            'post_max_size' => ini_get('post_max_size'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'content_length' => $request->header('Content-Length'),
            'files_count' => count($request->file('photos', [])),
            'memory_before_mb' => round($memBefore / 1048576, 2),
        ]);

        if (! $this->hasConfiguredR2()) {
            Log::channel('single')->error("[UPLOAD:{$uploadId}] R2 no configurado");
            throw new \RuntimeException('Cloudflare R2 no esta configurado. Completa bucket, endpoint y credenciales antes de subir archivos pesados.');
        }

        $request->validate([
            'photos' => 'required|array',
            'photos.*' => 'image|mimes:jpeg,png,jpg,webp|max:100000',
        ]);

        $tenant = $this->tenantContext->tenant();
        $incomingFiles = count($request->file('photos', []));

        if ($tenant && ! $tenant->canUseFeature('photo_uploads', $incomingFiles)) {
            Log::channel('single')->error("[UPLOAD:{$uploadId}] Limite de plan alcanzado", ['incoming' => $incomingFiles]);
            throw new \RuntimeException('Tu plan actual no permite subir esa cantidad de fotos este mes.');
        }

        $incomingOriginalBytes = collect($request->file('photos'))->sum(fn ($file) => $file->getSize() ?: 0);
        $currentOriginalBytes = $project->originalsUsageBytes();
        $maxOriginalsBytes = (int) ($project->planDefinition()['max_originals_bytes'] ?? $project->storage_limit_bytes ?? 0);

        Log::channel('single')->info("[UPLOAD:{$uploadId}] Validación de espacio", [
            'incoming_bytes' => $incomingOriginalBytes,
            'current_bytes' => $currentOriginalBytes,
            'max_bytes' => $maxOriginalsBytes,
        ]);

        if ($maxOriginalsBytes > 0 && ($currentOriginalBytes + $incomingOriginalBytes) > $maxOriginalsBytes) {
            Log::channel('single')->error("[UPLOAD:{$uploadId}] Sin espacio suficiente");
            throw new \RuntimeException('Espacio insuficiente para este evento.');
        }

        $orderIndex = $project->photos()->max('order_index') ?? 0;
        $tempMasterDirectory = "uploads/project_{$project->id}/temp_masters";

        foreach ($request->file('photos') as $index => $file) {
            $fileLabel = "[UPLOAD:{$uploadId}][foto ".($index+1)."/{$incomingFiles} {$file->getClientOriginalName()}]";
            $fileSizeMb = round($file->getSize() / 1048576, 2);

            Log::channel('single')->info("{$fileLabel} Iniciando — {$fileSizeMb}MB mime={$file->getMimeType()}");

            $safeBaseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
            $uniqueSuffix = uniqid();
            $originalFileName = "{$safeBaseName}_{$uniqueSuffix}.{$extension}";
            $optimizedFileName = "{$safeBaseName}_{$uniqueSuffix}.webp";

            // Guardar original en disco local temporal
            $localOriginalRelativePath = $file->storeAs($tempMasterDirectory, $originalFileName, 'local');
            $absoluteOriginalPath = Storage::disk('local')->path($localOriginalRelativePath);

            if (! file_exists($absoluteOriginalPath)) {
                Log::channel('single')->error("{$fileLabel} FALLO al guardar temp local", ['path' => $absoluteOriginalPath]);
                throw new \RuntimeException("No se pudo guardar el archivo temporal: {$originalFileName}");
            }

            Log::channel('single')->info("{$fileLabel} Guardado temp OK", [
                'path' => $absoluteOriginalPath,
                'size_bytes' => filesize($absoluteOriginalPath),
                'memory_mb' => round(memory_get_usage(true) / 1048576, 2),
            ]);

            $optimizedLocalRelativePath = "{$tempMasterDirectory}/optimized/{$optimizedFileName}";
            $absoluteOptimizedPath = Storage::disk('local')->path($optimizedLocalRelativePath);

            if (! file_exists(dirname($absoluteOptimizedPath))) {
                mkdir(dirname($absoluteOptimizedPath), 0755, true);
            }

            // Optimizar a webp
            Log::channel('single')->info("{$fileLabel} Iniciando optimización WebP", [
                'memory_mb' => round(memory_get_usage(true) / 1048576, 2),
            ]);

            $this->createOptimizedWebp($absoluteOriginalPath, $absoluteOptimizedPath, $project, $fileLabel);

            $optimizedExists = file_exists($absoluteOptimizedPath);
            $optimizedSize = $optimizedExists ? filesize($absoluteOptimizedPath) : 0;

            Log::channel('single')->info("{$fileLabel} Optimización completada", [
                'exists' => $optimizedExists,
                'optimized_size_bytes' => $optimizedSize,
                'memory_mb' => round(memory_get_usage(true) / 1048576, 2),
            ]);

            if (! $optimizedExists || $optimizedSize === 0) {
                Log::channel('single')->error("{$fileLabel} Archivo optimizado vacío o inexistente");
                throw new \RuntimeException("La optimización falló para: {$originalFileName}");
            }

            $originalR2Path = $project->originalsBucketPrefix()."/{$originalFileName}";
            $optimizedR2Path = $project->webBucketPrefix()."/{$optimizedFileName}";

            // Subir original a R2
            Log::channel('single')->info("{$fileLabel} Subiendo original a R2", ['r2_path' => $originalR2Path]);
            try {
                Storage::disk('r2')->put($originalR2Path, fopen($absoluteOriginalPath, 'r'));
                Log::channel('single')->info("{$fileLabel} Original subido a R2 OK");
            } catch (\Throwable $e) {
                Log::channel('single')->error("{$fileLabel} FALLO subida original R2", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw $e;
            }

            // Subir optimizado a R2
            Log::channel('single')->info("{$fileLabel} Subiendo optimizado a R2", ['r2_path' => $optimizedR2Path]);
            try {
                Storage::disk('r2')->put($optimizedR2Path, fopen($absoluteOptimizedPath, 'r'), [
                    'ContentType' => 'image/webp',
                ]);
                Log::channel('single')->info("{$fileLabel} Optimizado subido a R2 OK");
            } catch (\Throwable $e) {
                Log::channel('single')->error("{$fileLabel} FALLO subida optimizado R2", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw $e;
            }

            $photo = Photo::create([
                'project_id' => $project->id,
                'url' => $optimizedR2Path,
                'thumbnail_url' => $optimizedR2Path,
                'optimized_path' => $optimizedR2Path,
                'original_path' => $originalR2Path,
                'optimized_bytes' => @filesize($absoluteOptimizedPath) ?: null,
                'original_bytes' => @filesize($absoluteOriginalPath) ?: null,
                'mime_type' => $file->getMimeType(),
                'order_index' => ++$orderIndex,
                'category' => 'Master Set',
                'tags' => ['master-set'],
            ]);

            Log::channel('single')->info("{$fileLabel} Foto guardada en DB", ['photo_id' => $photo->id]);

            if ($project->face_recognition_enabled && $this->faceRecognitionService->enabled()) {
                DispatchFaceRecognitionTaskJob::dispatch('recognize_photo', $project->id, $photo->id, null);
            }
        }

        $project->update([
            'originals_expires_at' => now()->addDays($project->retention_days ?? $project->planDefinition()['retention_days'] ?? 90),
        ]);

        Storage::disk('local')->deleteDirectory($tempMasterDirectory);

        Log::channel('single')->info("[UPLOAD:{$uploadId}] === UPLOAD COMPLETADO proyecto={$project->id} ===", [
            'memory_peak_mb' => round(memory_get_peak_usage(true) / 1048576, 2),
        ]);

        $this->automationService->runImmediate('gallery_published', $project->load('lead', 'client'));
    }

    private function createOptimizedWebp(string $originalPath, string $optimizedPath, Project $project, string $logLabel = ''): void
    {
        $label = $logLabel ?: '[createOptimizedWebp]';

        $imageInfo = @getimagesize($originalPath);

        if (! $imageInfo) {
            Log::channel('single')->warning("{$label} getimagesize falló — copiando original sin optimizar", ['path' => $originalPath]);
            copy($originalPath, $optimizedPath);
            return;
        }

        Log::channel('single')->info("{$label} Imagen info", [
            'mime' => $imageInfo['mime'],
            'width' => $imageInfo[0],
            'height' => $imageInfo[1],
            'estimated_gd_memory_mb' => round(($imageInfo[0] * $imageInfo[1] * 4 * 2) / 1048576, 1),
            'memory_available_mb' => round((ini_parse_quantity(ini_get('memory_limit')) - memory_get_usage(true)) / 1048576, 1),
        ]);

        $image = null;

        try {
            if ($imageInfo['mime'] === 'image/jpeg') {
                $image = @imagecreatefromjpeg($originalPath);
            } elseif ($imageInfo['mime'] === 'image/png') {
                $image = @imagecreatefrompng($originalPath);
            } elseif ($imageInfo['mime'] === 'image/webp') {
                $image = @imagecreatefromwebp($originalPath);
            }
        } catch (\Throwable $e) {
            Log::channel('single')->error("{$label} Excepción al cargar imagen con GD", ['error' => $e->getMessage()]);
            $image = null;
        }

        if (! $image) {
            Log::channel('single')->warning("{$label} GD no pudo cargar la imagen — copiando original sin optimizar (probablemente falta memoria)", [
                'memory_mb' => round(memory_get_usage(true) / 1048576, 2),
                'last_error' => error_get_last(),
            ]);
            copy($originalPath, $optimizedPath);
            return;
        }

        Log::channel('single')->info("{$label} GD imagen cargada OK", [
            'memory_mb' => round(memory_get_usage(true) / 1048576, 2),
        ]);

        $width = imagesx($image);
        $height = imagesy($image);
        $maxDimension = 2000;

        if ($width > $maxDimension || $height > $maxDimension) {
            $ratio = min($maxDimension / $width, $maxDimension / $height);
            $newWidth = max(1, (int) round($width * $ratio));
            $newHeight = max(1, (int) round($height * $ratio));

            Log::channel('single')->info("{$label} Redimensionando", [
                'from' => "{$width}x{$height}",
                'to' => "{$newWidth}x{$newHeight}",
            ]);

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resized;
        }

        $this->applyWatermark($image, $project);

        $quality = 82;
        $webpResult = @imagewebp($image, $optimizedPath, $quality);

        if (! $webpResult) {
            Log::channel('single')->error("{$label} imagewebp falló al escribir el archivo", [
                'optimized_path' => $optimizedPath,
                'last_error' => error_get_last(),
            ]);
            imagedestroy($image);
            copy($originalPath, $optimizedPath);
            return;
        }

        while (@filesize($optimizedPath) > 800 * 1024 && $quality > 50) {
            $quality -= 5;
            @imagewebp($image, $optimizedPath, $quality);
        }

        Log::channel('single')->info("{$label} WebP generado", [
            'quality' => $quality,
            'size_kb' => round(@filesize($optimizedPath) / 1024, 1),
        ]);

        imagedestroy($image);
    }

    private function applyWatermark(\GdImage $image, Project $project): void
    {
        $mode = $project->planDefinition()['watermark_mode'] ?? null;

        if ($mode === 'platform_forced') {
            $this->applyTextWatermark($image, Setting::get('platform_watermark_label', 'PhotOS'));

            return;
        }

        if ($mode === 'photographer_custom') {
            $watermarkPath = Setting::get('photographer_watermark_path');

            if ($watermarkPath) {
                $absolutePath = storage_path('app/public/'.$watermarkPath);

                if (file_exists($absolutePath) && $this->applyImageWatermark($image, $absolutePath)) {
                    return;
                }
            }

            $this->applyTextWatermark($image, 'Studio');
        }
    }

    private function applyTextWatermark(\GdImage $image, string $label): void
    {
        $label = trim($label) ?: 'PhotOS';
        $width = imagesx($image);
        $height = imagesy($image);
        $font = 5;
        $textWidth = imagefontwidth($font) * strlen($label);
        $textHeight = imagefontheight($font);
        $padding = max(18, (int) round(min($width, $height) * 0.025));
        $x = max(10, $width - $textWidth - $padding);
        $y = max(10, $height - $textHeight - $padding);

        $shadow = imagecolorallocatealpha($image, 0, 0, 0, 80);
        $text = imagecolorallocatealpha($image, 255, 255, 255, 70);

        imagestring($image, $font, $x + 1, $y + 1, $label, $shadow);
        imagestring($image, $font, $x, $y, $label, $text);
    }

    private function applyImageWatermark(\GdImage $image, string $watermarkPath): bool
    {
        $mime = @mime_content_type($watermarkPath);
        $watermark = null;

        if ($mime === 'image/png') {
            $watermark = @imagecreatefrompng($watermarkPath);
        } elseif ($mime === 'image/webp') {
            $watermark = @imagecreatefromwebp($watermarkPath);
        }

        if (! $watermark) {
            return false;
        }

        imagealphablending($image, true);
        imagesavealpha($image, true);

        $imageWidth = imagesx($image);
        $imageHeight = imagesy($image);
        $wmWidth = imagesx($watermark);
        $wmHeight = imagesy($watermark);

        $targetWidth = max(120, (int) round($imageWidth * 0.18));
        $ratio = min($targetWidth / max(1, $wmWidth), ($imageHeight * 0.16) / max(1, $wmHeight));
        $drawWidth = max(1, (int) round($wmWidth * $ratio));
        $drawHeight = max(1, (int) round($wmHeight * $ratio));
        $padding = max(18, (int) round(min($imageWidth, $imageHeight) * 0.025));
        $destX = $imageWidth - $drawWidth - $padding;
        $destY = $imageHeight - $drawHeight - $padding;

        imagecopyresampled(
            $image,
            $watermark,
            $destX,
            $destY,
            0,
            0,
            $drawWidth,
            $drawHeight,
            $wmWidth,
            $wmHeight
        );

        imagedestroy($watermark);

        return true;
    }

    private function hasConfiguredR2(): bool
    {
        return filled(config('filesystems.disks.r2.key'))
            && filled(config('filesystems.disks.r2.secret'))
            && filled(config('filesystems.disks.r2.bucket'));
    }
}
