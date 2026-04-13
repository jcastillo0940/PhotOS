<?php

namespace App\Services;

use App\Models\Photo;
use App\Models\Project;
use App\Models\Setting;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectPhotoUploadService
{
    public function __construct(
        private readonly CrmAutomationService $automationService,
        private readonly TenantContext $tenantContext,
    ) {}

    public function upload(Request $request, Project $project): void
    {
        set_time_limit(0);

        if (! $this->hasConfiguredR2()) {
            throw new \RuntimeException('Cloudflare R2 no esta configurado. Completa bucket, endpoint y credenciales antes de subir archivos pesados.');
        }

        $request->validate([
            'photos' => 'required|array',
            'photos.*' => 'image|mimes:jpeg,png,jpg,webp|max:100000',
        ]);

        $tenant = $this->tenantContext->tenant();
        $incomingFiles = count($request->file('photos', []));

        if ($tenant && ! $tenant->canUseFeature('photo_uploads', $incomingFiles)) {
            throw new \RuntimeException('Tu plan actual no permite subir esa cantidad de fotos este mes.');
        }

        $incomingOriginalBytes = collect($request->file('photos'))->sum(fn ($file) => $file->getSize() ?: 0);
        $currentOriginalBytes = $project->originalsUsageBytes();
        $maxOriginalsBytes = (int) ($project->planDefinition()['max_originals_bytes'] ?? $project->storage_limit_bytes ?? 0);

        if ($maxOriginalsBytes > 0 && ($currentOriginalBytes + $incomingOriginalBytes) > $maxOriginalsBytes) {
            throw new \RuntimeException('Espacio insuficiente para este evento.');
        }

        $orderIndex = $project->photos()->max('order_index') ?? 0;
        $tempMasterDirectory = "uploads/project_{$project->id}/temp_masters";

        foreach ($request->file('photos') as $file) {
            $safeBaseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
            $uniqueSuffix = uniqid();
            $originalFileName = "{$safeBaseName}_{$uniqueSuffix}.{$extension}";
            $optimizedFileName = "{$safeBaseName}_{$uniqueSuffix}.webp";

            $localOriginalRelativePath = $file->storeAs($tempMasterDirectory, $originalFileName, 'local');
            $absoluteOriginalPath = Storage::disk('local')->path($localOriginalRelativePath);

            $optimizedLocalRelativePath = "{$tempMasterDirectory}/optimized/{$optimizedFileName}";
            $absoluteOptimizedPath = Storage::disk('local')->path($optimizedLocalRelativePath);

            if (! file_exists(dirname($absoluteOptimizedPath))) {
                mkdir(dirname($absoluteOptimizedPath), 0755, true);
            }

            $this->createOptimizedWebp($absoluteOriginalPath, $absoluteOptimizedPath, $project);

            $originalR2Path = $project->originalsBucketPrefix()."/{$originalFileName}";
            $optimizedR2Path = $project->webBucketPrefix()."/{$optimizedFileName}";

            Storage::disk('r2')->put($originalR2Path, fopen($absoluteOriginalPath, 'r'));
            Storage::disk('r2')->put($optimizedR2Path, fopen($absoluteOptimizedPath, 'r'), [
                'ContentType' => 'image/webp',
            ]);

            Photo::create([
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
        }

        $project->update([
            'originals_expires_at' => now()->addDays($project->retention_days ?? $project->planDefinition()['retention_days'] ?? 90),
        ]);

        Storage::disk('local')->deleteDirectory($tempMasterDirectory);

        $this->automationService->runImmediate('gallery_published', $project->load('lead', 'client'));
    }

    private function createOptimizedWebp(string $originalPath, string $optimizedPath, Project $project): void
    {
        $imageInfo = @getimagesize($originalPath);
        $image = null;

        if ($imageInfo) {
            if ($imageInfo['mime'] === 'image/jpeg') {
                $image = imagecreatefromjpeg($originalPath);
            } elseif ($imageInfo['mime'] === 'image/png') {
                $image = imagecreatefrompng($originalPath);
            } elseif ($imageInfo['mime'] === 'image/webp') {
                $image = imagecreatefromwebp($originalPath);
            }
        }

        if (! $image) {
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

        $this->applyWatermark($image, $project);

        $quality = 78;
        imagewebp($image, $optimizedPath, $quality);

        while (@filesize($optimizedPath) > 500 * 1024 && $quality > 50) {
            $quality -= 5;
            imagewebp($image, $optimizedPath, $quality);
        }

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
