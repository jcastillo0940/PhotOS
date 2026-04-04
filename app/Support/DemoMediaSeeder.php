<?php

namespace App\Support;

use App\Models\Photo;
use App\Models\Project;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class DemoMediaSeeder
{
    public function canWriteToR2(): bool
    {
        try {
            $path = 'demo-media/ping-'.uniqid().'.txt';
            Storage::disk('r2')->put($path, 'ping');
            Storage::disk('r2')->delete($path);

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    public function syncHomepageImages(): array
    {
        $homepage = HomepageSettings::get();

        $homepage['hero']['image_path'] = $this->uploadWebsiteImage('hero', 'Hero');
        $homepage['about']['image_path'] = $this->uploadWebsiteImage('about', 'About');

        foreach (range(0, 5) as $index) {
            $homepage['gallery']['images'][$index] = $this->uploadWebsiteImage("gallery-{$index}", 'Gallery '.($index + 1));
        }

        foreach (range(0, 2) as $index) {
            $homepage['featured']['items'][$index]['image_path'] = $this->uploadWebsiteImage("featured-{$index}", 'Featured '.($index + 1));
        }

        HomepageSettings::save($homepage);

        return $homepage;
    }

    public function syncProjectPhotos(Project $project, string $theme): void
    {
        $themes = [
            'wedding' => [
                ['title' => 'Ceremony', 'category' => 'Ceremony', 'tags' => ['ceremony', 'couple']],
                ['title' => 'Portraits', 'category' => 'Portraits', 'tags' => ['portrait', 'editorial']],
                ['title' => 'Details', 'category' => 'Details', 'tags' => ['details', 'rings']],
                ['title' => 'Reception', 'category' => 'Reception', 'tags' => ['party', 'dance']],
                ['title' => 'Golden Hour', 'category' => 'Portraits', 'tags' => ['golden-hour', 'portrait']],
                ['title' => 'Family', 'category' => 'Candid', 'tags' => ['family', 'candid']],
            ],
            'portrait' => [
                ['title' => 'Brand Portrait', 'category' => 'Studio', 'tags' => ['branding', 'studio']],
                ['title' => 'Editorial Motion', 'category' => 'Lifestyle', 'tags' => ['movement', 'editorial']],
                ['title' => 'Workspace Details', 'category' => 'Details', 'tags' => ['workspace', 'branding']],
                ['title' => 'Hero Headshot', 'category' => 'Studio', 'tags' => ['portrait', 'clean']],
                ['title' => 'Window Light', 'category' => 'Lifestyle', 'tags' => ['natural-light', 'brand']],
                ['title' => 'Studio Editorial', 'category' => 'Studio', 'tags' => ['headshot', 'studio']],
            ],
            'commercial' => [
                ['title' => 'Campaign Frame', 'category' => 'Campaign', 'tags' => ['fashion', 'campaign']],
                ['title' => 'Product Detail', 'category' => 'Product', 'tags' => ['product', 'editorial']],
                ['title' => 'Lifestyle Story', 'category' => 'Lifestyle', 'tags' => ['brand', 'story']],
                ['title' => 'Lookbook', 'category' => 'Campaign', 'tags' => ['lookbook', 'fashion']],
                ['title' => 'Texture', 'category' => 'Details', 'tags' => ['texture', 'product']],
                ['title' => 'Travel Mood', 'category' => 'Lifestyle', 'tags' => ['travel', 'brand']],
            ],
        ];

        $paletteMap = [
            'wedding' => [[146, 106, 90], [227, 201, 185], [86, 58, 47]],
            'portrait' => [[95, 96, 120], [230, 220, 211], [44, 45, 61]],
            'commercial' => [[68, 111, 96], [220, 216, 196], [31, 53, 46]],
        ];

        $photoSet = $themes[$theme] ?? [];
        $palette = $paletteMap[$theme] ?? [[80, 80, 80], [220, 220, 220], [20, 20, 20]];

        foreach ($project->photos()->orderBy('order_index')->get() as $index => $photo) {
            $meta = $photoSet[$index] ?? ['title' => 'Demo Photo', 'category' => 'General', 'tags' => ['demo']];
            $base = $project->id.'/demo/'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT);

            $paths = $this->uploadPhotoSet($base, $project->name, $meta['title'], $palette, $index);

            $photo->update([
                'url' => $paths['optimized'],
                'thumbnail_url' => $paths['optimized'],
                'optimized_path' => $paths['optimized'],
                'original_path' => $paths['original'],
                'optimized_bytes' => $paths['optimized_bytes'],
                'original_bytes' => $paths['original_bytes'],
                'mime_type' => 'image/webp',
                'category' => $meta['category'],
                'tags' => $meta['tags'],
            ]);
        }
    }

    private function uploadWebsiteImage(string $slug, string $title): string
    {
        $base = 'website/demo/'.$slug;
        $asset = $this->generateImagePair($title, 'MONO Studio', [94, 71, 57], [231, 220, 208], [38, 28, 22], 1600, 1200);

        Storage::disk('r2')->put($base.'.jpg', fopen($asset['original_file'], 'r'));
        Storage::disk('r2')->put($base.'.webp', fopen($asset['optimized_file'], 'r'), ['ContentType' => 'image/webp']);

        @unlink($asset['original_file']);
        @unlink($asset['optimized_file']);

        return 'r2://'.$base.'.webp';
    }

    private function uploadPhotoSet(string $base, string $projectName, string $title, array $palette, int $index): array
    {
        $asset = $this->generateImagePair($projectName, $title, $palette[0], $palette[1], $palette[2], 1800, 1350, $index);
        $original = $base.'.jpg';
        $optimized = $base.'.webp';

        Storage::disk('r2')->put($original, fopen($asset['original_file'], 'r'));
        Storage::disk('r2')->put($optimized, fopen($asset['optimized_file'], 'r'), ['ContentType' => 'image/webp']);

        $payload = [
            'original' => $original,
            'optimized' => $optimized,
            'original_bytes' => filesize($asset['original_file']) ?: null,
            'optimized_bytes' => filesize($asset['optimized_file']) ?: null,
        ];

        @unlink($asset['original_file']);
        @unlink($asset['optimized_file']);

        return $payload;
    }

    private function generateImagePair(
        string $title,
        string $subtitle,
        array $topColor,
        array $bottomColor,
        array $textColor,
        int $width,
        int $height,
        int $variant = 0
    ): array {
        if (! function_exists('imagecreatetruecolor')) {
            throw new RuntimeException('GD is required to generate demo assets.');
        }

        $image = imagecreatetruecolor($width, $height);

        for ($y = 0; $y < $height; $y++) {
            $mix = $height > 1 ? $y / ($height - 1) : 0;
            $red = (int) round($topColor[0] + (($bottomColor[0] - $topColor[0]) * $mix));
            $green = (int) round($topColor[1] + (($bottomColor[1] - $topColor[1]) * $mix));
            $blue = (int) round($topColor[2] + (($bottomColor[2] - $topColor[2]) * $mix));
            $lineColor = imagecolorallocate($image, $red, $green, $blue);
            imageline($image, 0, $y, $width, $y, $lineColor);
        }

        $overlay = imagecolorallocatealpha($image, 255, 255, 255, 104);
        $panel = imagecolorallocatealpha($image, 0, 0, 0, 98);
        $text = imagecolorallocate($image, $textColor[0], $textColor[1], $textColor[2]);
        $textInverse = imagecolorallocate($image, 248, 244, 238);

        imagefilledellipse($image, (int) ($width * 0.78), (int) ($height * 0.24), 320 + ($variant * 10), 320 + ($variant * 10), $overlay);
        imagefilledrectangle($image, 70, $height - 280, $width - 70, $height - 70, $panel);

        imagestring($image, 5, 110, $height - 240, strtoupper(substr($title, 0, 42)), $textInverse);
        imagestring($image, 3, 110, $height - 205, substr($subtitle, 0, 62), $textInverse);
        imagestring($image, 2, 110, $height - 165, 'PhotOS demo asset stored in Cloudflare R2', $textInverse);
        imagestring($image, 2, $width - 240, 48, 'Frame '.($variant + 1), $text);

        $originalFile = tempnam(sys_get_temp_dir(), 'demo_original_');
        $optimizedFile = tempnam(sys_get_temp_dir(), 'demo_optimized_');

        imagejpeg($image, $originalFile, 90);
        imagewebp($image, $optimizedFile, 80);
        imagedestroy($image);

        return [
            'original_file' => $originalFile,
            'optimized_file' => $optimizedFile,
        ];
    }
}
