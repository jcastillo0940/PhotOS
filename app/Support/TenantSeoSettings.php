<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class TenantSeoSettings
{
    public const SETTING_KEY = 'homepage_seo';

    public static function defaults(array $homepage = []): array
    {
        $brand = $homepage['brand'] ?? [];
        $name = $brand['name'] ?? 'PhotOS';
        $tagline = $brand['tagline'] ?? 'Fotografia profesional, galerias privadas y reservas online.';

        return [
            'enabled' => true,
            'indexable' => true,
            'title' => $name.' | Fotografia profesional',
            'description' => Str::limit(strip_tags((string) $tagline), 155, ''),
            'keywords' => '',
            'canonical_url' => '',
            'og_title' => '',
            'og_description' => '',
            'og_image_url' => '',
            'twitter_card' => 'summary_large_image',
            'google_site_verification' => '',
            'schema_type' => 'LocalBusiness',
            'business_name' => $name,
            'business_description' => $tagline,
            'phone' => '',
            'email' => '',
            'street_address' => '',
            'locality' => '',
            'region' => '',
            'postal_code' => '',
            'country' => '',
            'latitude' => '',
            'longitude' => '',
            'price_range' => '$$',
            'area_served' => '',
            'services' => '',
            'same_as' => '',
        ];
    }

    public static function get(?int $tenantId = null, array $homepage = []): array
    {
        if (!Schema::hasTable('settings')) {
            return self::sanitize(self::defaults($homepage), $homepage);
        }

        $stored = Setting::getForTenant($tenantId, self::SETTING_KEY);
        $decoded = $stored ? json_decode($stored, true) : null;

        if (!is_array($decoded)) {
            $decoded = self::defaults($homepage);
        }

        return self::sanitize(array_merge(self::defaults($homepage), $decoded), $homepage);
    }

    public static function save(array $content, ?int $tenantId = null, array $homepage = []): void
    {
        if (!Schema::hasTable('settings')) {
            return;
        }

        Setting::setForTenant(
            $tenantId,
            self::SETTING_KEY,
            json_encode(self::sanitize($content, $homepage), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'homepage'
        );
    }

    public static function sanitize(array $content, array $homepage = []): array
    {
        $defaults = self::defaults($homepage);
        $schemaType = in_array($content['schema_type'] ?? '', ['LocalBusiness', 'ProfessionalService', 'Organization'], true)
            ? $content['schema_type']
            : $defaults['schema_type'];
        $twitterCard = in_array($content['twitter_card'] ?? '', ['summary', 'summary_large_image'], true)
            ? $content['twitter_card']
            : $defaults['twitter_card'];

        return [
            'enabled' => filter_var($content['enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'indexable' => filter_var($content['indexable'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'title' => self::clean($content['title'] ?? $defaults['title'], 90),
            'description' => self::clean($content['description'] ?? $defaults['description'], 180),
            'keywords' => self::clean($content['keywords'] ?? '', 240),
            'canonical_url' => self::clean($content['canonical_url'] ?? '', 255),
            'og_title' => self::clean($content['og_title'] ?? '', 90),
            'og_description' => self::clean($content['og_description'] ?? '', 180),
            'og_image_url' => self::clean($content['og_image_url'] ?? '', 255),
            'twitter_card' => $twitterCard,
            'google_site_verification' => self::clean($content['google_site_verification'] ?? '', 180),
            'schema_type' => $schemaType,
            'business_name' => self::clean($content['business_name'] ?? $defaults['business_name'], 120),
            'business_description' => self::clean($content['business_description'] ?? $defaults['business_description'], 240),
            'phone' => self::clean($content['phone'] ?? '', 60),
            'email' => self::clean($content['email'] ?? '', 120),
            'street_address' => self::clean($content['street_address'] ?? '', 160),
            'locality' => self::clean($content['locality'] ?? '', 100),
            'region' => self::clean($content['region'] ?? '', 100),
            'postal_code' => self::clean($content['postal_code'] ?? '', 30),
            'country' => self::clean($content['country'] ?? '', 80),
            'latitude' => self::clean($content['latitude'] ?? '', 40),
            'longitude' => self::clean($content['longitude'] ?? '', 40),
            'price_range' => self::clean($content['price_range'] ?? '$$', 80),
            'area_served' => self::clean($content['area_served'] ?? '', 180),
            'services' => self::clean($content['services'] ?? '', 300),
            'same_as' => self::clean($content['same_as'] ?? '', 500),
        ];
    }

    public static function toFrontend(array $settings, Request $request, array $homepage = []): array
    {
        $seo = self::sanitize($settings, $homepage);
        $url = $seo['canonical_url'] ?: $request->url();
        $title = $seo['title'] ?: ($homepage['brand']['name'] ?? 'PhotOS');
        $description = $seo['description'] ?: ($homepage['brand']['tagline'] ?? '');
        $image = $seo['og_image_url'] ?: ($homepage['hero']['image_url'] ?? null);
        $sameAs = self::csv($seo['same_as']);
        $services = self::csv($seo['services']);

        $organization = array_filter([
            '@context' => 'https://schema.org',
            '@type' => $seo['schema_type'],
            'name' => $seo['business_name'] ?: $title,
            'description' => $seo['business_description'] ?: $description,
            'url' => $url,
            'telephone' => $seo['phone'] ?: null,
            'email' => $seo['email'] ?: null,
            'image' => $image ? [$image] : null,
            'priceRange' => $seo['price_range'] ?: null,
            'areaServed' => $seo['area_served'] ?: null,
            'sameAs' => $sameAs ?: null,
            'knowsAbout' => $services ?: null,
            'address' => self::address($seo),
            'geo' => self::geo($seo),
        ]);

        return [
            ...$seo,
            'computed' => [
                'title' => $title,
                'description' => $description,
                'canonical_url' => $url,
                'og_title' => $seo['og_title'] ?: $title,
                'og_description' => $seo['og_description'] ?: $description,
                'og_image_url' => $image,
                'robots' => $seo['indexable'] ? 'index, follow, max-image-preview:large' : 'noindex, nofollow',
                'json_ld' => array_values(array_filter([
                    [
                        '@context' => 'https://schema.org',
                        '@type' => 'WebSite',
                        'name' => $seo['business_name'] ?: $title,
                        'url' => $request->getSchemeAndHttpHost(),
                    ],
                    $organization,
                ])),
            ],
        ];
    }

    private static function clean(mixed $value, int $limit): string
    {
        return Str::limit(trim(strip_tags((string) $value)), $limit, '');
    }

    private static function csv(string $value): array
    {
        return collect(explode(',', $value))
            ->map(fn ($item) => trim($item))
            ->filter()
            ->values()
            ->all();
    }

    private static function address(array $seo): ?array
    {
        if (!$seo['street_address'] && !$seo['locality'] && !$seo['country']) {
            return null;
        }

        return array_filter([
            '@type' => 'PostalAddress',
            'streetAddress' => $seo['street_address'] ?: null,
            'addressLocality' => $seo['locality'] ?: null,
            'addressRegion' => $seo['region'] ?: null,
            'postalCode' => $seo['postal_code'] ?: null,
            'addressCountry' => $seo['country'] ?: null,
        ]);
    }

    private static function geo(array $seo): ?array
    {
        if (!$seo['latitude'] || !$seo['longitude']) {
            return null;
        }

        return [
            '@type' => 'GeoCoordinates',
            'latitude' => $seo['latitude'],
            'longitude' => $seo['longitude'],
        ];
    }
}
