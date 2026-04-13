<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectCollaborator;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ProjectCollaboratorController extends Controller
{
    public function store(Request $request, Project $project)
    {
        abort_unless($project->userCan($request->user(), 'manage_gallery'), 403);

        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'can_upload' => 'nullable|boolean',
            'can_manage_gallery' => 'nullable|boolean',
        ]);

        $email = Str::lower(trim((string) $validated['email']));

        $user = User::withoutGlobalScope('tenant')
            ->where('email', $email)
            ->first();

        if (! $user || ! $user->isPhotographer()) {
            return back()->with('error', 'El acceso solo puede asignarse a usuarios existentes con rol photographer.');
        }

        $issuedToken = ProjectCollaborator::issueAccessToken();

        $collaborator = ProjectCollaborator::withoutGlobalScope('tenant')->updateOrCreate(
            [
                'project_id' => $project->id,
                'user_id' => $user->id,
            ],
            [
                'tenant_id' => $project->tenant_id,
                'invited_by_user_id' => $request->user()?->id,
                'invited_email' => $email,
                'role' => 'photographer',
                'status' => 'invited',
                'access_code' => strtoupper(Str::random(6)),
                'access_token' => $issuedToken['encrypted'],
                'access_token_hash' => $issuedToken['hash'],
                'can_upload' => (bool) ($validated['can_upload'] ?? true),
                'can_manage_gallery' => (bool) ($validated['can_manage_gallery'] ?? false),
                'accepted_at' => null,
            ]
        );

        $invitationUrl = $this->accessUrl($collaborator, $issuedToken['plain']);
        $mailError = $this->sendInvitationEmail($collaborator, $invitationUrl);

        return back()->with('success', 'Invitacion creada. Link: '.$invitationUrl.($mailError ? ' | Correo no enviado: '.$mailError : ''));
    }

    public function destroy(Project $project, ProjectCollaborator $collaborator)
    {
        abort_unless($collaborator->project_id === $project->id, 404);
        abort_unless($project->userCan(request()->user(), 'manage_gallery'), 403);

        $collaborator->delete();

        return back()->with('success', 'Acceso del fotografo eliminado del proyecto.');
    }

    public function regenerate(Project $project, ProjectCollaborator $collaborator)
    {
        abort_unless($collaborator->project_id === $project->id, 404);
        abort_unless($project->userCan(request()->user(), 'manage_gallery'), 403);

        $issuedToken = ProjectCollaborator::issueAccessToken();

        $collaborator->update([
            'status' => 'invited',
            'access_code' => strtoupper(Str::random(6)),
            'access_token' => $issuedToken['encrypted'],
            'access_token_hash' => $issuedToken['hash'],
            'accepted_at' => null,
        ]);

        $freshCollaborator = $collaborator->fresh(['project', 'invitedBy']);
        $invitationUrl = $this->accessUrl($freshCollaborator, $issuedToken['plain']);
        $mailError = $this->sendInvitationEmail($freshCollaborator, $invitationUrl);

        return back()->with('success', 'Acceso regenerado. El enlace anterior quedo invalidado.'.($mailError ? ' | Correo no enviado: '.$mailError : ''));
    }

    public function revoke(Project $project, ProjectCollaborator $collaborator)
    {
        abort_unless($collaborator->project_id === $project->id, 404);
        abort_unless($project->userCan(request()->user(), 'manage_gallery'), 403);

        $collaborator->update([
            'status' => 'revoked',
            'accepted_at' => null,
        ]);

        return back()->with('success', 'Acceso revocado para este fotografo.');
    }

    private function accessUrl(ProjectCollaborator $collaborator, ?string $plainToken = null): string
    {
        return route('project.invitations.show', $plainToken ?: $collaborator->plainAccessToken());
    }

    private function sendInvitationEmail(ProjectCollaborator $collaborator, string $invitationUrl): ?string
    {
        try {
            $collaborator->loadMissing(['project', 'invitedBy']);
            Mail::send('emails.project-invitation', [
                'collaborator' => $collaborator,
                'invitationUrl' => $invitationUrl,
            ], function ($message) use ($collaborator) {
                $message
                    ->to($collaborator->invited_email)
                    ->subject('Invitacion para colaborar en un proyecto');
            });

            return null;
        } catch (\Throwable $e) {
            return $e->getMessage();
        }
    }
}
