<?php

namespace App\Providers;

use App\Models\Setting;
use App\Services\Billing\TenantBillingService;
use App\Support\Tenancy\TenantContext;
use App\Support\TenantThemeSettings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TenantContext::class, fn () => new TenantContext);
    }

    public function boot(): void
    {
        Schema::defaultStringLength(191);

        Gate::define('viewPulse', function ($user) {
            return $user && ($user->isDeveloper() || $user->isOwner());
        });

        Inertia::share('auth', fn () => [
            'user' => auth()->user()
                ? [
                    'id' => auth()->id(),
                    'name' => auth()->user()->name,
                    'email' => auth()->user()->email,
                    'role' => auth()->user()->role,
                ]
                : null,
        ]);

        Inertia::share('flash', fn () => [
            'success' => session('success'),
            'error' => session('error'),
            'integration_test' => session('integration_test'),
        ]);

        Inertia::share('tenantBilling', function () {
            try {
                return app(TenantBillingService::class)->billingStateFor(app(TenantContext::class)->tenant());
            } catch (\Throwable $e) {
                return [
                    'status' => 'unknown',
                    'allow_front' => true,
                    'allow_backoffice' => true,
                    'allow_write' => true,
                    'is_read_only' => false,
                    'banner' => null,
                    'grace_ends_at' => null,
                ];
            }
        });

        Inertia::share('tenant', function () {
            $tenant = app(TenantContext::class)->tenant();

            return $tenant
                ? [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'status' => $tenant->status,
                    'plan_code' => $tenant->plan_code,
                ]
                : null;
        });

        Inertia::share('branding', function () {
            try {
                if (! Schema::hasTable('settings')) {
                    return [
                        'app_name' => config('app.name', 'PhotOS'),
                        'app_tagline' => 'Admin platform',
                        'app_logo_url' => null,
                        'app_favicon_url' => null,
                    ];
                }

                $logoPath = Setting::get('app_logo_path');
                $faviconPath = Setting::get('app_favicon_path');

                return [
                    'app_name' => Setting::get('app_name', config('app.name', 'PhotOS')),
                    'app_tagline' => Setting::get('app_tagline', 'Admin platform'),
                    'app_logo_url' => $logoPath ? asset('storage/'.$logoPath) : null,
                    'app_favicon_url' => $faviconPath ? asset('storage/'.$faviconPath) : null,
                ];
            } catch (\Throwable $e) {
                return [
                    'app_name' => config('app.name', 'PhotOS'),
                    'app_tagline' => 'Admin platform',
                    'app_logo_url' => null,
                    'app_favicon_url' => null,
                ];
            }
        });

        Inertia::share('publicTheme', function () {
            try {
                return TenantThemeSettings::get(app(TenantContext::class)->id());
            } catch (\Throwable $e) {
                return TenantThemeSettings::toFrontend(TenantThemeSettings::defaults());
            }
        });

        try {
            if (Schema::hasTable('settings')) {
                $dbSettings = DB::table('settings')
                    ->whereNull('tenant_id')
                    ->get()
                    ->pluck('value', 'key');

                // Cloudflare R2
                $r2Key = $dbSettings->get('r2_key');
                $r2Secret = $dbSettings->get('r2_secret');
                $r2Bucket = $dbSettings->get('r2_bucket');
                $r2Endpoint = $dbSettings->get('r2_endpoint');

                if ($r2Key && $r2Secret && $r2Bucket) {
                    config([
                        'filesystems.disks.r2.key' => $r2Key,
                        'filesystems.disks.r2.secret' => $r2Secret,
                        'filesystems.disks.r2.bucket' => $r2Bucket,
                        'filesystems.disks.r2.endpoint' => $r2Endpoint,
                    ]);
                    Storage::forgetDisk('r2');
                }

                // Cloudflare SaaS
                config([
                    'services.cloudflare_saas.api_token' => $dbSettings->get('cloudflare_saas_api_token', env('CLOUDFLARE_SAAS_API_TOKEN')),
                    'services.cloudflare_saas.zone_id' => $dbSettings->get('cloudflare_saas_zone_id', env('CLOUDFLARE_SAAS_ZONE_ID')),
                    'services.cloudflare_saas.managed_cname_target' => $dbSettings->get('cloudflare_saas_cname_target', env('CLOUDFLARE_SAAS_CNAME_TARGET')),
                    'services.cloudflare_saas.dcv_target' => $dbSettings->get('cloudflare_saas_dcv_target', env('CLOUDFLARE_SAAS_DCV_TARGET')),
                ]);

                // PayPal
                config([
                    'services.paypal.client_id' => $dbSettings->get('paypal_client_id', env('PAYPAL_CLIENT_ID')),
                    'services.paypal.secret' => $dbSettings->get('paypal_secret', env('PAYPAL_SECRET')),
                    'services.paypal.environment' => $dbSettings->get('paypal_environment', env('PAYPAL_ENVIRONMENT', 'sandbox')),
                    'services.paypal.webhook_id' => $dbSettings->get('paypal_webhook_id', env('PAYPAL_WEBHOOK_ID')),
                ]);

                // SMTP
                $smtpEnabled = filter_var($dbSettings->get('smtp_enabled', '0'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false;
                config([
                    'mail.default' => $smtpEnabled ? 'smtp' : env('MAIL_MAILER', 'log'),
                    'mail.mailers.smtp.host' => $dbSettings->get('smtp_host', env('MAIL_HOST', '127.0.0.1')),
                    'mail.mailers.smtp.port' => (int) $dbSettings->get('smtp_port', env('MAIL_PORT', 2525)),
                    'mail.mailers.smtp.username' => $dbSettings->get('smtp_username', env('MAIL_USERNAME')),
                    'mail.mailers.smtp.password' => $dbSettings->get('smtp_password', env('MAIL_PASSWORD')),
                    'mail.mailers.smtp.scheme' => $dbSettings->get('smtp_scheme', env('MAIL_SCHEME')),
                    'mail.from.address' => $dbSettings->get('smtp_from_address', env('MAIL_FROM_ADDRESS', 'hello@example.com')),
                    'mail.from.name' => $dbSettings->get('smtp_from_name', $dbSettings->get('app_name', env('MAIL_FROM_NAME', config('app.name', 'PhotOS')))),
                ]);
            }
        } catch (\Throwable $e) {
            // Silently fail during bootstrap to avoid crashing the app if DB is not ready
        }
    }
}
