<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SaasConfigurationSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // PayPal Live (Configurar desde panel o .env, omitidas por seguridad en repo)
            'paypal_client_id' => env('PAYPAL_CLIENT_ID', ''),
            'paypal_secret' => env('PAYPAL_SECRET', ''),
            'paypal_environment' => env('PAYPAL_ENVIRONMENT', 'live'),
            'paypal_webhook_id' => env('PAYPAL_WEBHOOK_ID', ''),

            // Cloudflare R2 (Tokens purgados de los repositorios por seguridad)
            'r2_key' => env('R2_KEY', ''),
            'r2_secret' => env('R2_SECRET', ''),
            'r2_bucket' => env('R2_BUCKET', ''),
            'r2_endpoint' => env('R2_ENDPOINT', ''),

            // Cloudflare SaaS (Tokens purgados de los repositorios)
            'cloudflare_saas_api_token' => env('CLOUDFLARE_SAAS_API_TOKEN', ''),
            'cloudflare_saas_zone_id' => env('CLOUDFLARE_SAAS_ZONE_ID', ''),
            'cloudflare_saas_cname_target' => env('CLOUDFLARE_SAAS_CNAME_TARGET', ''),
            'cloudflare_saas_dcv_target' => env('CLOUDFLARE_SAAS_DCV_TARGET', ''),

            // App Settings
            'app_name' => 'PhotOS',
            'app_tagline' => 'Plataforma de Fotografía SaaS',
        ];

        foreach ($settings as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key, 'tenant_id' => null],
                ['value' => $value]
            );
        }

        // Seeder para los Planes Saas
        $plans = [
            [
                'code' => 'starter',
                'name' => 'Starter (Free)',
                'is_active' => true,
                'features' => json_encode([
                    'projects_limit' => 1,
                    'storage_gb' => 1,
                    'ai_scans_monthly' => 50,
                    'watermark' => 'branded',
                    'staff_limit' => 1,
                    'custom_domain' => false,
                    'price_monthly' => 0,
                    'price_yearly' => 0,
                ]),
            ],
            [
                'code' => 'professional',
                'name' => 'Professional',
                'is_active' => true,
                'features' => json_encode([
                    'projects_limit' => null,
                    'storage_gb' => 50,
                    'ai_scans_monthly' => 2500,
                    'watermark' => 'custom',
                    'staff_limit' => 1,
                    'custom_domain' => false,
                    'price_monthly' => 29,
                    'price_monthly_promo' => null,
                    'price_yearly' => 290,
                    'price_yearly_promo' => 199,
                ]),
            ],
            [
                'code' => 'studio_gold',
                'name' => 'Studio Gold',
                'is_active' => true,
                'features' => json_encode([
                    'projects_limit' => null,
                    'storage_gb' => 250,
                    'ai_scans_monthly' => 10000,
                    'watermark' => 'white_label',
                    'staff_limit' => 5,
                    'custom_domain' => true,
                    'price_monthly' => 59,
                    'price_yearly' => 590,
                ]),
            ],
        ];

        foreach ($plans as $plan) {
            DB::table('saas_plans')->updateOrInsert(
                ['code' => $plan['code']],
                array_merge($plan, ['updated_at' => now(), 'created_at' => now()])
            );
        }
    }
}
