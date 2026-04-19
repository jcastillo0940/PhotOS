<?php

namespace App\Http\Middleware;

use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class GeminiRateLimit
{
    public function __construct(private readonly TenantContext $tenantContext) {}

    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $this->tenantContext->tenant();

        if (! $tenant) {
            return $next($request);
        }

        $features = $tenant->plan?->resolvedFeatures() ?? [];
        $rpm = (int) ($features['gemini_rpm'] ?? 0);
        $rpd = (int) ($features['gemini_rpd'] ?? 0);

        // 0 means no limit configured for this plan (AI not enabled)
        if ($rpm === 0 && $rpd === 0) {
            return $next($request);
        }

        $tenantId = $tenant->id;

        // ── RPM check ────────────────────────────────────────────────────────────
        if ($rpm > 0) {
            $minuteKey = "gemini:rpm:{$tenantId}:" . now()->format('YmdHi');
            Cache::add($minuteKey, 0, 70);
            $rpmCount = Cache::increment($minuteKey);

            if ($rpmCount > $rpm) {
                return $this->tooManyRequests('rpm', $rpm, 'Límite de solicitudes por minuto alcanzado. Intenta en el próximo minuto.');
            }
        }

        // ── RPD check ────────────────────────────────────────────────────────────
        if ($rpd > 0) {
            $dayKey = "gemini:rpd:{$tenantId}:" . now()->format('Ymd');
            $secondsUntilMidnight = now()->endOfDay()->diffInSeconds(now()) + 60;
            Cache::add($dayKey, 0, $secondsUntilMidnight);
            $rpdCount = Cache::increment($dayKey);

            if ($rpdCount > $rpd) {
                return $this->tooManyRequests('rpd', $rpd, 'Límite de solicitudes diarias alcanzado. Intenta mañana.');
            }
        }

        return $next($request);
    }

    private function tooManyRequests(string $type, int $limit, string $message): Response
    {
        if (request()->wantsJson() || request()->header('X-Inertia')) {
            return response()->json([
                'error' => 'too_many_requests',
                'limit_type' => $type,
                'limit' => $limit,
                'message' => $message,
            ], 429);
        }

        return back(status: 303)->with('error', $message);
    }
}
