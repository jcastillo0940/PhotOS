<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStudioOperator
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user, 403);

        if ($user->isDeveloper()) {
            return redirect()->route('admin.dashboard')->with('error', 'Esta seccion pertenece al backoffice del fotografo, no a la consola del SaaS.');
        }

        return $next($request);
    }
}
