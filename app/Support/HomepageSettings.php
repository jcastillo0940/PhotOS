<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;

class HomepageSettings
{
    public const SETTING_KEY = 'homepage_content';

    public static function defaults(): array
    {
        return [
            'brand' => [
                'name' => 'MONO Studio',
                'tagline' => 'Portraits, weddings, and stories shaped by light.',
            ],
            'sections_order' => ['hero', 'about', 'gallery', 'featured', 'contact'],
            'hero' => [
                'eyebrow' => 'Editorial photographer',
                'title' => 'Portraits that feel cinematic, intimate, and alive.',
                'description' => 'A modern photography studio for couples, brands, and families who want images with depth, softness, and intention.',
                'primary_cta_label' => 'Book your session',
                'primary_cta_target' => '#contact',
                'secondary_cta_label' => 'View portfolio',
                'secondary_cta_target' => '#gallery',
                'image_path' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80',
                'floating_caption' => 'Seeking stillness through photography',
            ],
            'about' => [
                'eyebrow' => 'About me',
                'heading' => 'Photographs embedded with light, texture, and silence.',
                'body' => 'I work with people who want images that feel elegant without becoming stiff. Every session is guided with calm direction, natural movement, and space for real emotion.',
                'detail' => 'Based in Costa Rica, available for destination work, intimate weddings, portraits, and visual storytelling for modern brands.',
                'image_path' => 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
                'stats' => [
                    ['value' => '120+', 'label' => 'sessions captured'],
                    ['value' => '8 yrs', 'label' => 'experience behind the lens'],
                    ['value' => '24 hrs', 'label' => 'response promise'],
                ],
            ],
            'gallery' => [
                'eyebrow' => 'Selected work',
                'heading' => 'A gallery shaped by emotion, landscape, and movement.',
                'description' => 'A curated mix of portraits, weddings, and personal stories with an editorial eye.',
                'images' => [
                    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
                ],
            ],
            'featured' => [
                'eyebrow' => 'Featured projects',
                'heading' => 'Stories built for people who want more than pretty pictures.',
                'description' => 'Each project can spotlight a niche, signature offer, or dream type of client.',
                'items' => [
                    [
                        'title' => 'Weddings & couples',
                        'category' => 'Soft, elegant, documentary storytelling',
                        'image_path' => 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&w=1200&q=80',
                    ],
                    [
                        'title' => 'Portrait sessions',
                        'category' => 'Editorial direction with natural movement',
                        'image_path' => 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
                    ],
                    [
                        'title' => 'Outdoor brands',
                        'category' => 'Real stories in natural settings',
                        'image_path' => 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=1200&q=80',
                    ],
                ],
            ],
            'contact' => [
                'eyebrow' => 'Contact',
                'heading' => 'Tell me what you are dreaming up.',
                'description' => 'Share your idea, date, and the kind of photography you are looking for. I will follow up with availability and next steps.',
                'form_heading' => 'Start your project',
                'submit_label' => 'Send inquiry',
                'info_label' => 'Studio details',
                'info_lines' => [
                    'Replies in less than 24 hours',
                    'Destination bookings available',
                    'Admin access available in the footer',
                ],
            ],
        ];
    }

    public static function get(): array
    {
        if (! Schema::hasTable('settings')) {
            return self::defaults();
        }

        $stored = Setting::get(self::SETTING_KEY);

        if (! $stored) {
            $defaults = self::defaults();
            self::save($defaults);

            return $defaults;
        }

        $decoded = json_decode($stored, true);

        if (! is_array($decoded)) {
            $defaults = self::defaults();
            self::save($defaults);

            return $defaults;
        }

        return self::mergeRecursive(self::defaults(), $decoded);
    }

    public static function save(array $content): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        Setting::set(
            self::SETTING_KEY,
            json_encode($content, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'homepage'
        );
    }

    public static function sanitize(array $content): array
    {
        $defaults = self::defaults();
        $merged = self::mergeRecursive($defaults, $content);

        $allowedSections = ['hero', 'about', 'gallery', 'featured', 'contact'];
        $order = array_values(array_filter($merged['sections_order'] ?? [], fn ($section) => in_array($section, $allowedSections, true)));
        $merged['sections_order'] = array_values(array_unique(array_merge($order, array_diff($allowedSections, $order))));

        $merged['gallery']['images'] = array_values(array_pad(array_slice($merged['gallery']['images'] ?? [], 0, 6), 6, null));
        $merged['featured']['items'] = array_values(array_pad(array_slice($merged['featured']['items'] ?? [], 0, 3), 3, [
            'title' => '',
            'category' => '',
            'image_path' => null,
        ]));
        $merged['about']['stats'] = array_values(array_pad(array_slice($merged['about']['stats'] ?? [], 0, 3), 3, [
            'value' => '',
            'label' => '',
        ]));
        $merged['contact']['info_lines'] = array_values(array_pad(array_slice($merged['contact']['info_lines'] ?? [], 0, 3), 3, ''));

        return $merged;
    }

    public static function toFrontend(array $content): array
    {
        $content['hero']['image_url'] = self::resolveAsset($content['hero']['image_path'] ?? null);
        $content['about']['image_url'] = self::resolveAsset($content['about']['image_path'] ?? null);
        $content['gallery']['image_urls'] = array_map(fn ($image) => self::resolveAsset($image), $content['gallery']['images'] ?? []);

        $content['featured']['items'] = array_map(function ($item) {
            $item['image_url'] = self::resolveAsset($item['image_path'] ?? null);

            return $item;
        }, $content['featured']['items'] ?? []);

        return $content;
    }

    public static function resolveAsset(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        if (str_starts_with($path, 'r2://')) {
            $r2Path = substr($path, 5);

            try {
                return Storage::disk('r2')->temporaryUrl($r2Path, now()->addMinutes(60));
            } catch (\Throwable $e) {
                Log::warning('Unable to resolve homepage asset from R2.', [
                    'path' => $r2Path,
                    'message' => $e->getMessage(),
                ]);

                return null;
            }
        }

        return Storage::disk('public')->url($path);
    }

    private static function mergeRecursive(array $defaults, array $custom): array
    {
        foreach ($custom as $key => $value) {
            if (is_array($value) && isset($defaults[$key]) && is_array($defaults[$key]) && self::isAssoc($value) && self::isAssoc($defaults[$key])) {
                $defaults[$key] = self::mergeRecursive($defaults[$key], $value);
                continue;
            }

            $defaults[$key] = $value;
        }

        return $defaults;
    }

    private static function isAssoc(array $array): bool
    {
        return array_keys($array) !== range(0, count($array) - 1);
    }
}
