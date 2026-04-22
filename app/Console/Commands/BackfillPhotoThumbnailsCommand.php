<?php

namespace App\Console\Commands;

use App\Models\Photo;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BackfillPhotoThumbnailsCommand extends Command
{
    protected $signature = 'photos:backfill-thumbnails {--project= : Solo procesa un proyecto} {--limit=0 : Maximo de fotos a procesar}';

    protected $description = 'Genera thumbnails WebP livianos para fotos existentes en R2';

    public function handle(): int
    {
        $limit = max(0, (int) $this->option('limit'));
        $processed = 0;
        $created = 0;
        $skipped = 0;

        $query = Photo::withoutGlobalScope('tenant')
            ->whereNotNull('optimized_path')
            ->where(function ($query) {
                $query->whereNull('thumbnail_url')
                    ->orWhereColumn('thumbnail_url', 'optimized_path')
                    ->orWhereColumn('thumbnail_url', 'url');
            })
            ->orderBy('id');

        if ($projectId = $this->option('project')) {
            $query->where('project_id', $projectId);
        }

        $query->chunkById(50, function ($photos) use (&$processed, &$created, &$skipped, $limit) {
            foreach ($photos as $photo) {
                if ($limit > 0 && $processed >= $limit) {
                    return false;
                }

                $processed++;

                try {
                    if ($this->createThumbnail($photo)) {
                        $created++;
                    } else {
                        $skipped++;
                    }
                } catch (\Throwable $e) {
                    $skipped++;
                    $this->warn("Foto {$photo->id}: {$e->getMessage()}");
                }
            }
        });

        $this->info("Fotos revisadas: {$processed}");
        $this->info("Thumbnails creados: {$created}");
        $this->info("Omitidas: {$skipped}");

        return self::SUCCESS;
    }

    private function createThumbnail(Photo $photo): bool
    {
        $sourcePath = $photo->optimized_path;

        if (! $sourcePath || Str::startsWith($sourcePath, ['http://', 'https://']) || ! Storage::disk('r2')->exists($sourcePath)) {
            return false;
        }

        $tempDir = storage_path('app/tmp/photo-thumbnails');
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $localSource = $tempDir.'/'.uniqid('source_', true).'.webp';
        $localThumb = $tempDir.'/'.uniqid('thumb_', true).'.webp';

        try {
            file_put_contents($localSource, Storage::disk('r2')->get($sourcePath));

            if (! $this->writeThumbnail($localSource, $localThumb) || ! file_exists($localThumb) || filesize($localThumb) === 0) {
                return false;
            }

            $baseName = pathinfo($sourcePath, PATHINFO_FILENAME);
            $thumbnailPath = trim(dirname($sourcePath), '.\\/').'/thumbs/'.$baseName.'_thumb.webp';

            Storage::disk('r2')->put($thumbnailPath, fopen($localThumb, 'r'), [
                'ContentType' => 'image/webp',
                'CacheControl' => 'public, max-age=31536000, immutable',
            ]);

            $photo->update(['thumbnail_url' => $thumbnailPath]);

            return true;
        } finally {
            if (file_exists($localSource)) {
                @unlink($localSource);
            }

            if (file_exists($localThumb)) {
                @unlink($localThumb);
            }
        }
    }

    private function writeThumbnail(string $source, string $target): bool
    {
        $info = @getimagesize($source);
        if (! $info) {
            return false;
        }

        $image = match ($info['mime'] ?? null) {
            'image/jpeg' => @imagecreatefromjpeg($source),
            'image/png' => @imagecreatefrompng($source),
            'image/webp' => @imagecreatefromwebp($source),
            default => null,
        };

        if (! $image) {
            return false;
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $maxDimension = 640;

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

        $quality = 72;
        $result = @imagewebp($image, $target, $quality);

        while ($result && @filesize($target) > 160 * 1024 && $quality > 48) {
            $quality -= 6;
            $result = @imagewebp($image, $target, $quality);
        }

        imagedestroy($image);

        return (bool) $result;
    }
}
