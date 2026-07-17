<?php

namespace App\Http\Middleware;

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
        $guard = app(TenantContext::class)->guard();
        $user  = Auth::guard($guard)->user();

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
            // Tells the login form which surface/guard to authenticate against
            'surface' => $guard,
        ]);
    }
}
