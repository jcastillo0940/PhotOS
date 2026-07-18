<?php

namespace App\Modules\Auth\Controllers;
use App\Http\Controllers\Controller;

use App\Models\User;
use App\Modules\Tenancy\Services\AuditService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;
    private const DECAY_SECONDS = 900;

    public function __construct(private readonly AuditService $audit) {}

    /**
     * Guards that each role is permitted to authenticate against.
     * A client can never log into the studio guard; a developer can never log into studio.
     * This prevents surface escalation through the login form.
     */
    private const ROLE_GUARD_MAP = [
        'saas'   => ['developer'],
        'client' => ['client'],
        'studio' => ['owner', 'operator', 'photographer'],
        'web'    => ['owner', 'operator', 'photographer', 'developer', 'client'], // fallback
    ];

    public function loginView()
    {
        if (request()->filled('redirect')) {
            request()->session()->put('url.intended', request()->string('redirect')->toString());
        }

        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'     => 'required|string|max:255',
            'password'  => 'required|string|max:255',
            'remember'  => 'nullable|boolean',
            '_surface'  => 'nullable|string|in:studio,client,saas,web',
        ]);

        if ($validator->fails()) {
            throw ValidationException::withMessages([
                'auth' => 'Credenciales invalidas.',
            ]);
        }

        $credentials = $validator->validated();
        $throttleKey = $this->throttleKey($request);

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages([
                'auth' => "Demasiados intentos. Intenta de nuevo en {$seconds} segundos.",
            ]);
        }

        $guard    = app(TenantContext::class)->guard();
        $tenantId = app(TenantContext::class)->id();
        $email    = Str::lower(trim((string) $credentials['email']));

        $user = User::withoutGlobalScope('tenant')
            ->where(function ($query) use ($tenantId) {
                if ($tenantId) {
                    $query->where('tenant_id', $tenantId)
                          ->orWhereNull('tenant_id');
                } else {
                    $query->whereNull('tenant_id');
                }
            })
            ->where('email', $email)
            ->first();

        if ($user && Hash::check($credentials['password'], $user->password)) {

            // Enforce role → guard mapping: prevents surface escalation via login form.
            $allowed = self::ROLE_GUARD_MAP[$guard] ?? [];
            if (! in_array($user->role, $allowed, true)) {
                RateLimiter::hit($throttleKey, self::DECAY_SECONDS);
                $this->audit->logAs('auth.login_failed', ['id' => $user->id, 'name' => $user->name, 'email' => $user->email], $user->tenant_id, [
                    'reason' => 'role_mismatch', 'role' => $user->role, 'guard' => $guard,
                ]);
                throw ValidationException::withMessages([
                    'auth' => $this->guardMismatchMessage($user->role, $guard),
                ]);
            }

            // Failsafe: global user without tenant_id on a tenant domain must be developer/operator.
            if ($tenantId && $user->tenant_id === null
                && ! in_array($user->role, ['developer', 'operator'], true)
                && ! $user->hasActiveProjectAccessForTenant((int) $tenantId)
            ) {
                RateLimiter::hit($throttleKey, self::DECAY_SECONDS);
                $this->audit->logAs('auth.login_failed', ['id' => $user->id, 'name' => $user->name, 'email' => $user->email], $user->tenant_id, [
                    'reason' => 'tenant_mismatch',
                ]);
                throw ValidationException::withMessages([
                    'auth' => 'Acceso denegado a este dominio.',
                ]);
            }

            RateLimiter::clear($throttleKey);
            Auth::guard($guard)->login($user, (bool) ($credentials['remember'] ?? false));
            $request->session()->regenerate();

            $this->audit->logAs('auth.login_success', ['id' => $user->id, 'name' => $user->name, 'email' => $user->email], $user->tenant_id, [
                'guard' => $guard,
            ]);

            return redirect()->intended($this->defaultRedirectForUser($user));
        }

        RateLimiter::hit($throttleKey, self::DECAY_SECONDS);
        $this->audit->logAs('auth.login_failed', ['id' => null, 'name' => '', 'email' => $email], $tenantId, [
            'reason' => 'invalid_credentials',
        ]);

        throw ValidationException::withMessages([
            'auth' => 'Credenciales invalidas para este dominio.',
        ]);
    }

    public function logout(Request $request)
    {
        $guard = app(TenantContext::class)->guard();
        $this->audit->log('auth.logout', ['guard' => $guard]);
        Auth::guard($guard)->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }

    private function defaultRedirectForUser(User $user): string
    {
        return match (true) {
            $user->isClient()    => route('client.dashboard'),
            $user->isDeveloper() => route('saas.tenants.index'),
            default              => route('admin.dashboard'),
        };
    }

    private function guardMismatchMessage(string $role, string $guard): string
    {
        if ($role === 'client' && $guard === 'studio') {
            return 'Este acceso es para el personal del estudio. Tu portal de cliente se encuentra en una URL diferente.';
        }
        if ($role === 'developer' && $guard !== 'saas') {
            return 'El acceso de desarrollador es exclusivo del panel SaaS.';
        }
        if ($guard === 'saas' && $role !== 'developer') {
            return 'Solo los desarrolladores pueden acceder al panel SaaS.';
        }
        if ($role === 'client' && $guard === 'saas') {
            return 'Tu acceso de cliente no corresponde a este panel.';
        }
        return 'Tu acceso no corresponde a esta superficie. Ingresa desde la URL correcta.';
    }

    private function throttleKey(Request $request): string
    {
        return Str::transliterate(
            Str::lower(trim((string) $request->input('email'))) . '|' . $request->ip()
        );
    }
}
