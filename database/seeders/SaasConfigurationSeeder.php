<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SaasConfigurationSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // PayPal Live (Invitaboda)
            'paypal_client_id' => 'AW5_ttAbeLfy2VdG86ANuoEqVVZ6pNGTnMWQGlGlOTl_fc-BKaHzMwO3wdxfQycCsLEUN8lZxeKgtacZ',
            'paypal_secret' => 'ELABIp1Cvkk_umoP8jwPxze9oMMmu6Snmhl9bnquu_t0Q5X7SzCoWVGu04kAjOjjxmTPwCJ4-Kaw4nz5',
            'paypal_environment' => 'live',
            'paypal_webhook_id' => '3BA40170FT119070N',

            // Cloudflare R2
            'r2_key' => '568e68b1acf742068bfb98ec7ee93f15',
            'r2_secret' => 'cfa483f60ce6b3e1942afd128cfac18369ace5adcbb5caf851565722307b7006',
            'r2_bucket' => 'luis-espino',
            'r2_endpoint' => 'https://83fc4f2e5ca424944692d8a43d56e681.r2.cloudflarestorage.com',

            // Cloudflare SaaS
            'cloudflare_saas_api_token' => 'cfat_FqviSHotAEZNNvm3mqqTyrKNnmFjltsu7ZCvXGYP79b57a6a',
            'cloudflare_saas_zone_id' => '4fc1e143561734ce06867d42b0658127',
            'cloudflare_saas_cname_target' => 'fallback.pixelprocr.com',
            'cloudflare_saas_dcv_target' => 'f2b8962b4b923bf2.dcv.cloudflare.com',

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
