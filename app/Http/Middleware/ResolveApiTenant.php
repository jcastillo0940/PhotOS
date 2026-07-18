<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Models\User;
use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class ResolveApiTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();

        if (! $bearer) {
            return response()->json(['message' => 'Token de API requerido.'], 401);
        }

        // Sanctum format: "{id}|{token}" — only the part after | is hashed and stored.
        $parts = explode('|', $bearer, 2);
        $tokenValue = $parts[1] ?? $bearer;
        $hash = hash('sha256', $tokenValue);
        $accessToken = PersonalAccessToken::where('token', $hash)->first();

        if (! $accessToken) {
            return response()->json(['message' => 'Token invalido.'], 401);
        }

        if ($accessToken->expires_at && $accessToken->expires_at->isPast()) {
            return response()->json(['message' => 'Token expirado.'], 401);
        }

        $user = User::withoutGlobalScope('tenant')->find($accessToken->tokenable_id);

        if (! $user || ! in_array($user->role, ['owner', 'operator'], true)) {
            return response()->json(['message' => 'Sin acceso de API para este usuario.'], 403);
        }

        $tenant = Tenant::find($user->tenant_id);

        if (! $tenant) {
            return response()->json(['message' => 'Estudio no encontrado.'], 404);
        }

        if ($tenant->isSystemBlocked()) {
            return response()->json(['message' => 'La cuenta esta bloqueada. Contacta al soporte.'], 403);
        }

        $context = app(TenantContext::class);
        $context->set($tenant, null);
        $context->setGuard('studio', 'api');

        config(['filesystems.disks.r2.root' => "tenants/{$tenant->slug}"]);
        Storage::forgetDisk('r2');

        $request->setUserResolver(fn () => $user);

        $accessToken->forceFill(['last_used_at' => now()])->save();

        return $next($request);
    }
}
