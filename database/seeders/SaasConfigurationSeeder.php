<?php

namespace Database\Seeders;

use App\Support\SaasPlanCatalog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SaasConfigurationSeeder extends Seeder
{
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

        foreach (SaasPlanCatalog::defaults() as $definition) {
            DB::table('saas_plans')->updateOrInsert(
                ['code' => $definition['code']],
                [
                    'name' => $definition['name'],
                    'is_active' => true,
                    'features' => json_encode($definition['features'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
