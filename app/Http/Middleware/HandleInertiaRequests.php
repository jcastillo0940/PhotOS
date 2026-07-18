<?php

namespace App\Http\Middleware;

use App\Services\Billing\TenantBillingService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $context = app(TenantContext::class);
        $guard   = $context->guard();
        $user    = Auth::guard($guard)->user();
        $tenant  = $context->tenant();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user
                    ? [
                        'id'        => $user->id,
                        'name'      => $user->name,
                        'email'     => $user->email,
                        'role'      => $user->role,
                        'tenant_id' => $user->tenant_id,
                    ]
                    : null,
            ],
            'flash' => [
                'success'          => fn () => $request->session()->get('success'),
                'error'            => fn () => $request->session()->get('error'),
                'integration_test' => fn () => $request->session()->get('integration_test'),
            ],
            'surface' => $guard,
            'billing' => fn () => $tenant && $user && in_array($guard, ['studio', 'client'], true)
                ? $this->billingSnapshot($tenant)
                : null,
        ]);
    }

    private function billingSnapshot(\App\Models\Tenant $tenant): array
    {
        $state = app(TenantBillingService::class)->billingStateFor($tenant);

        return [
            'status'       => $state['status'],
            'is_read_only' => $state['is_read_only'],
            'banner'       => $state['banner'],
            'grace_ends_at' => $state['grace_ends_at'],
            'expires_at'   => $state['expires_at'],
        ];
    }
}
