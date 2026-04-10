<?php

namespace App\Http\Controllers;

use App\Models\User;
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

    public function loginView()
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|max:255',
            'password' => 'required|string|max:255',
            'remember' => 'nullable|boolean',
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

        $tenantId = app(TenantContext::class)->id();
        $email = Str::lower(trim((string) $credentials['email']));

        $user = User::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('email', $email)
            ->first();

        if ($user && Hash::check($credentials['password'], $user->password)) {
            RateLimiter::clear($throttleKey);
            Auth::login($user, (bool) ($credentials['remember'] ?? false));
            $request->session()->regenerate();
            $request->session()->forget('url.intended');

            return redirect()->route('admin.dashboard');
        }

        RateLimiter::hit($throttleKey, self::DECAY_SECONDS);

        throw ValidationException::withMessages([
            'auth' => 'Credenciales invalidas para este dominio.',
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }

    private function throttleKey(Request $request): string
    {
        return Str::transliterate(
            Str::lower(trim((string) $request->input('email'))).'|'.$request->ip()
        );
    }
}
