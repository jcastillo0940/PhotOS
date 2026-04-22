<?php

namespace Database\Seeders;

use App\Support\SaasPlanCatalog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SaasConfigurationSeeder extends Seeder
{
    private const LEGACY_PLAN_MAP = [
        'studio' => 'starter',
        'professional' => 'pro',
        'studio_gold' => 'business',
        'scale' => 'enterprise',
    ];

    public function run(): void
    {
        $settings = [
            'paypal_client_id' => env('PAYPAL_CLIENT_ID', ''),
            'paypal_secret' => env('PAYPAL_SECRET', ''),
            'paypal_environment' => env('PAYPAL_ENVIRONMENT', 'live'),
            'paypal_webhook_id' => env('PAYPAL_WEBHOOK_ID', ''),
            'r2_key' => env('R2_KEY', ''),
            'r2_secret' => env('R2_SECRET', ''),
            'r2_bucket' => env('R2_BUCKET', ''),
            'r2_endpoint' => env('R2_ENDPOINT', ''),
            'cloudflare_account_id' => env('CLOUDFLARE_ACCOUNT_ID', ''),
            'cloudflare_registrar_api_token' => env('CLOUDFLARE_REGISTRAR_API_TOKEN', ''),
            'cloudflare_dns_api_token' => env('CLOUDFLARE_DNS_API_TOKEN', ''),
            'cloudflare_saas_api_token' => env('CLOUDFLARE_SAAS_API_TOKEN', ''),
            'cloudflare_saas_zone_id' => env('CLOUDFLARE_SAAS_ZONE_ID', ''),
            'cloudflare_saas_cname_target' => env('CLOUDFLARE_SAAS_CNAME_TARGET', ''),
            'cloudflare_saas_dcv_target' => env('CLOUDFLARE_SAAS_DCV_TARGET', ''),
            'app_name' => 'PhotOS',
            'app_tagline' => 'Plataforma de Fotografia SaaS',
        ];

        foreach ($settings as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key, 'tenant_id' => null],
                ['value' => $value]
            );
        }

        $this->syncLegacyPlanCodes();

        foreach (SaasPlanCatalog::defaults() as $definition) {
            DB::table('saas_plans')->updateOrInsert(
                ['code' => $definition['code']],
                [
                    'name' => $definition['name'],
                    'is_active' => true,
                    'features' => json_encode(array_merge($definition['features'], [
                        'segment' => $definition['segment'] ?? null,
                        'price_monthly' => $definition['price_monthly'] ?? 0,
                        'price_yearly' => $definition['price_yearly'] ?? 0,
                    ]), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        DB::table('saas_plans')
            ->whereIn('code', array_keys(self::LEGACY_PLAN_MAP))
            ->delete();

        $activePlanFeatures = collect(SaasPlanCatalog::defaults())
            ->mapWithKeys(fn (array $definition) => [$definition['code'] => $definition['features']])
            ->all();

        DB::table('tenants')
            ->orderBy('id')
            ->get(['id', 'plan_code'])
            ->each(function (object $tenant) use ($activePlanFeatures) {
                $features = $activePlanFeatures[$tenant->plan_code] ?? [];

                DB::table('tenants')
                    ->where('id', $tenant->id)
                    ->update([
                        'ai_enabled' => (bool) (($features['ai_face_recognition'] ?? false) || ($features['ai_sponsor_detection'] ?? false)),
                        'custom_domain_enabled' => (bool) ($features['custom_domain'] ?? false),
                        'updated_at' => now(),
                    ]);
            });
    }

    private function syncLegacyPlanCodes(): void
    {
        foreach (self::LEGACY_PLAN_MAP as $legacy => $current) {
            DB::table('tenants')->where('plan_code', $legacy)->update(['plan_code' => $current]);
            DB::table('tenant_subscriptions')->where('plan_code', $legacy)->update(['plan_code' => $current]);
            DB::table('saas_registrations')->where('plan_code', $legacy)->update(['plan_code' => $current]);
        }
    }
}
