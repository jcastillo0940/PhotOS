<?php

namespace App\Providers;

use Inertia\Inertia;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Schema::defaultStringLength(191);

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

        Inertia::share('branding', function () {
            try {
                if (!\Illuminate\Support\Facades\Schema::hasTable('settings')) {
                    return [
                        'app_name' => config('app.name', 'PhotOS'),
                        'app_tagline' => 'Admin platform',
                        'app_logo_url' => null,
                        'app_favicon_url' => null,
                    ];
                }

                $logoPath = \App\Models\Setting::get('app_logo_path');
                $faviconPath = \App\Models\Setting::get('app_favicon_path');

                return [
                    'app_name' => \App\Models\Setting::get('app_name', config('app.name', 'PhotOS')),
                    'app_tagline' => \App\Models\Setting::get('app_tagline', 'Admin platform'),
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

        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('settings')) {
                $r2Key = \App\Models\Setting::get('r2_key');
                $r2Secret = \App\Models\Setting::get('r2_secret');
                $r2Bucket = \App\Models\Setting::get('r2_bucket');
                $r2Endpoint = \App\Models\Setting::get('r2_endpoint');
                $smtpEnabled = filter_var(\App\Models\Setting::get('smtp_enabled', '0'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false;

                if ($r2Key && $r2Secret) {
                    config([
                        'filesystems.disks.r2.key' => $r2Key,
                        'filesystems.disks.r2.secret' => $r2Secret,
                        'filesystems.disks.r2.bucket' => $r2Bucket,
                        'filesystems.disks.r2.endpoint' => $r2Endpoint,
                    ]);
                }

                config([
                    'mail.default' => $smtpEnabled ? 'smtp' : env('MAIL_MAILER', 'log'),
                    'mail.mailers.smtp.host' => \App\Models\Setting::get('smtp_host', env('MAIL_HOST', '127.0.0.1')),
                    'mail.mailers.smtp.port' => (int) \App\Models\Setting::get('smtp_port', env('MAIL_PORT', 2525)),
                    'mail.mailers.smtp.username' => \App\Models\Setting::get('smtp_username', env('MAIL_USERNAME')),
                    'mail.mailers.smtp.password' => \App\Models\Setting::get('smtp_password', env('MAIL_PASSWORD')),
                    'mail.mailers.smtp.scheme' => \App\Models\Setting::get('smtp_scheme', env('MAIL_SCHEME')),
                    'mail.from.address' => \App\Models\Setting::get('smtp_from_address', env('MAIL_FROM_ADDRESS', 'hello@example.com')),
                    'mail.from.name' => \App\Models\Setting::get('smtp_from_name', \App\Models\Setting::get('app_name', env('MAIL_FROM_NAME', config('app.name', 'PhotOS')))),
                ]);
            }
        } catch (\Exception $e) {
            // Ignore during migrations or when database is not yet ready.
        }
    }
}
