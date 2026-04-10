<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProjectAccess
{
    public function handle(Request $request, Closure $next, string $ability = 'view'): Response
    {
        $user = $request->user();
        abort_unless($user, 403);

        /** @var Project|int|string|null $projectRouteParam */
        $projectRouteParam = $request->route('project');
        $project = $projectRouteParam instanceof Project
            ? $projectRouteParam
            : Project::query()->findOrFail($projectRouteParam);

        abort_unless($project->userCan($user, $ability), 403, 'No tienes permisos para acceder a este proyecto.');

        return $next($request);
    }
}
