<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDeveloper
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless(
            $user && in_array($user->role, ['developer', 'owner'], true),
            403,
            'Solo un usuario con acceso total puede acceder a esta seccion.'
        );

        return $next($request);
    }
}
