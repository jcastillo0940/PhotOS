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
        ]);

        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('settings')) {
                $r2Key = \App\Models\Setting::get('r2_key');
                $r2Secret = \App\Models\Setting::get('r2_secret');
                $r2Bucket = \App\Models\Setting::get('r2_bucket');
                $r2Endpoint = \App\Models\Setting::get('r2_endpoint');

                if ($r2Key && $r2Secret) {
                    config([
                        'filesystems.disks.r2.key' => $r2Key,
                        'filesystems.disks.r2.secret' => $r2Secret,
                        'filesystems.disks.r2.bucket' => $r2Bucket,
                        'filesystems.disks.r2.endpoint' => $r2Endpoint,
                    ]);
                }
            }
        } catch (\Exception $e) {
            // Ignore during migrations or when database is not yet ready.
        }
    }
}
