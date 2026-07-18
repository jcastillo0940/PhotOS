<?php

namespace App\Modules\Auth\Actions;

use App\Models\User;
use App\Modules\Tenancy\Services\AuditService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginAction
{
    private const MAX_ATTEMPTS = 5;
    private const DECAY_SECONDS = 900;

    private const ROLE_GUARD_MAP = [
        'saas'   => ['developer'],
        'client' => ['client'],
        'studio' => ['owner', 'operator', 'photographer'],
        'web'    => ['owner', 'operator', 'photographer', 'developer', 'client'],
    ];

    public function __construct(
        private readonly AuditService $audit,
        private readonly TenantContext $tenantContext,
    ) {}

    public function execute(array $credentials, string $ip): User
    {
        $throttleKey = Str::transliterate(Str::lower(trim($credentials['email'])) . '|' . $ip);

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages([
                'auth' => "Demasiados intentos. Intenta de nuevo en {$seconds} segundos.",
            ]);
        }

        $guard    = $this->tenantContext->guard();
        $tenantId = $this->tenantContext->id();
        $email    = Str::lower(trim($credentials['email']));

        $user = User::withoutGlobalScope('tenant')
            ->where(function ($query) use ($tenantId) {
                if ($tenantId) {
                    $query->where('tenant_id', $tenantId)->orWhereNull('tenant_id');
                } else {
                    $query->whereNull('tenant_id');
                }
            })
            ->where('email', $email)
            ->first();

        if ($user && Hash::check($credentials['password'], $user->password)) {
            $allowed = self::ROLE_GUARD_MAP[$guard] ?? [];

            if (! in_array($user->role, $allowed, true)) {
                RateLimiter::hit($throttleKey, self::DECAY_SECONDS);
                throw ValidationException::withMessages(['auth' => 'Tu acceso no corresponde a esta superficie.']);
            }

            if ($tenantId && $user->tenant_id === null
                && ! in_array($user->role, ['developer', 'operator'], true)
                && ! $user->hasActiveProjectAccessForTenant((int) $tenantId)
            ) {
                RateLimiter::hit($throttleKey, self::DECAY_SECONDS);
                throw ValidationException::withMessages(['auth' => 'Acceso denegado a este dominio.']);
            }

            RateLimiter::clear($throttleKey);
            Auth::guard($guard)->login($user, (bool) ($credentials['remember'] ?? false));

            return $user;
        }

        RateLimiter::hit($throttleKey, self::DECAY_SECONDS);
        throw ValidationException::withMessages(['auth' => 'Credenciales invalidas para este dominio.']);
    }
}
