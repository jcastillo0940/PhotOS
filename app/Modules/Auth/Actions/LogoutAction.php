<?php

namespace App\Modules\Auth\Actions;

use App\Modules\Tenancy\Services\AuditService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogoutAction
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly TenantContext $tenantContext,
    ) {}

    public function execute(Request $request): void
    {
        $guard = $this->tenantContext->guard();
        $this->audit->log('auth.logout', ['guard' => $guard]);
        Auth::guard($guard)->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
