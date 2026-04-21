<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use App\Models\ProjectCollaborator;
use App\Services\ProjectPhotoUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProjectInvitationController extends Controller
{
    public function __construct(
        private readonly ProjectPhotoUploadService $projectPhotoUploadService,
    ) {}

    public function show(Request $request, string $token)
    {
        $collaborator = $this->resolveCollaborator($token);

        if ($this->hasWorkspaceAccess($request, $collaborator)) {
            return redirect()->route('project.invitations.gallery', $token);
        }

        return Inertia::render('Public/ProjectInvitation', [
            'invitation' => [
                'token' => $token,
                'status' => $collaborator->status,
                'invited_email' => $collaborator->invited_email,
                'access_code_hint' => 'Ingresa el codigo compartido por el owner u operator.',
                'project' => [
                    'id' => $collaborator->project?->id,
                    'name' => $collaborator->project?->name,
                ],
            ],
        ]);
    }

    public function accept(Request $request, string $token)
    {
        $collaborator = $this->resolveCollaborator($token);

        if ($collaborator->status === 'revoked') {
            return back()->with('error', 'Esta invitacion fue revocada por el owner u operator.');
        }

        $validated = $request->validate([
            'access_code' => 'required|string|max:32',
        ]);

        if (! hash_equals((string) $collaborator->access_code, strtoupper(trim((string) $validated['access_code'])))) {
            return back()->with('error', 'El codigo de acceso no es valido.');
        }

        $collaborator->update([
            'status' => 'active',
            'accepted_at' => now(),
        ]);

        $this->rememberWorkspaceAccess($request, $collaborator);

        return redirect()
            ->route('project.invitations.gallery', $token)
            ->with('success', 'Acceso validado. Ya puedes subir fotos a este proyecto.');
    }

    public function gallery(Request $request, string $token)
    {
        $collaborator = $this->authorizedCollaborator($request, $token);
        $this->rememberWorkspaceAccess($request, $collaborator);
        $project = $collaborator->project()->with('photos')->firstOrFail();

        return Inertia::render('Public/ProjectCollaboratorGallery', [
            'workspace' => [
                'token' => $token,
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'client_name' => $project->lead?->name,
                    'can_upload' => (bool) $collaborator->can_upload,
                    'can_manage_gallery' => (bool) $collaborator->can_manage_gallery,
                    'photos_count' => $project->photos->count(),
                ],
                'collaborator' => [
                    'email' => $collaborator->invited_email,
                    'status' => $collaborator->status,
                ],
                'photos' => $project->photos
                    ->sortBy('order_index')
                    ->values()
                    ->map(fn (Photo $photo) => [
                        'id' => $photo->id,
                        'thumbnail_url' => $photo->optimized_path ? $this->temporaryUrlOrFallback($photo->optimized_path) : $photo->thumbnail_url,
                        'url' => $photo->optimized_path ? $this->temporaryUrlOrFallback($photo->optimized_path) : $photo->url,
                        'created_at' => optional($photo->created_at)?->toIso8601String(),
                    ])
                    ->all(),
            ],
        ]);
    }

    public function upload(Request $request, string $token)
    {
        $collaborator = $this->authorizedCollaborator($request, $token);

        if (! $collaborator->can_upload) {
            return back(status: 303)->with('error', 'Este acceso no tiene permiso para subir fotos.');
        }

        try {
            $this->projectPhotoUploadService->upload($request, $collaborator->project);
        } catch (\RuntimeException $e) {
            return back(status: 303)->with('error', $e->getMessage());
        }

        return back(status: 303)->with('success', 'Fotos sincronizadas correctamente.');
    }

    private function resolveCollaborator(string $token): ProjectCollaborator
    {
        return ProjectCollaborator::findByPlainAccessToken($token)?->load(['project.lead'])
            ?? abort(404);
    }

    private function authorizedCollaborator(Request $request, string $token): ProjectCollaborator
    {
        $collaborator = $this->resolveCollaborator($token);
        abort_unless($this->hasWorkspaceAccess($request, $collaborator), 403, 'Debes validar el codigo de acceso antes de continuar.');

        return $collaborator;
    }

    private function hasWorkspaceAccess(Request $request, ProjectCollaborator $collaborator): bool
    {
        if ($collaborator->status === 'revoked') {
            return false;
        }

        $payload = $request->session()->get($this->workspaceSessionKey($collaborator));

        if ($this->workspaceAccessPayloadIsValid($payload, $collaborator)) {
            return true;
        }

        $cookiePayload = json_decode((string) $request->cookie($this->workspaceCookieName($collaborator)), true);

        if ($this->workspaceAccessPayloadIsValid($cookiePayload, $collaborator)) {
            $request->session()->put($this->workspaceSessionKey($collaborator), $cookiePayload);

            return true;
        }

        return false;
    }

    private function workspaceSessionKey(ProjectCollaborator $collaborator): string
    {
        return 'project_collaborator_access.'.$collaborator->id;
    }

    private function workspaceCookieName(ProjectCollaborator $collaborator): string
    {
        return 'project_collaborator_access_'.$collaborator->id;
    }

    private function rememberWorkspaceAccess(Request $request, ProjectCollaborator $collaborator): void
    {
        $payload = [
            'collaborator_id' => $collaborator->id,
            'project_id' => $collaborator->project_id,
            'granted_at' => now()->toIso8601String(),
        ];

        $request->session()->put($this->workspaceSessionKey($collaborator), $payload);

        cookie()->queue(cookie(
            $this->workspaceCookieName($collaborator),
            json_encode($payload),
            60 * 24 * 30,
            null,
            null,
            $request->isSecure(),
            true,
            false,
            'lax',
        ));
    }

    private function workspaceAccessPayloadIsValid(mixed $payload, ProjectCollaborator $collaborator): bool
    {
        return is_array($payload)
            && (int) ($payload['collaborator_id'] ?? 0) === (int) $collaborator->id
            && (int) ($payload['project_id'] ?? 0) === (int) $collaborator->project_id;
    }

    private function temporaryUrlOrFallback(string $path): string
    {
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        try {
            return Storage::disk('r2')->temporaryUrl($path, now()->addMinutes(60));
        } catch (\Throwable $e) {
            return $path;
        }
    }
}
