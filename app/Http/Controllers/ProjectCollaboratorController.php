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

        if (!$user || !$user->isPhotographer()) {
            return back()->with('error', 'El acceso solo puede asignarse a usuarios existentes con rol photographer.');
        }

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
                'access_token' => Str::random(64),
                'can_upload' => (bool) ($validated['can_upload'] ?? true),
                'can_manage_gallery' => (bool) ($validated['can_manage_gallery'] ?? false),
                'accepted_at' => null,
            ]
        );

        $mailError = $this->sendInvitationEmail($collaborator);

        return back()->with('success', 'Invitacion creada. Link: '.$this->accessUrl($collaborator).($mailError ? ' | Correo no enviado: '.$mailError : ''));
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

        $collaborator->update([
            'status' => 'invited',
            'access_code' => strtoupper(Str::random(6)),
            'access_token' => Str::random(64),
            'accepted_at' => null,
        ]);

        $mailError = $this->sendInvitationEmail($collaborator->fresh(['project', 'invitedBy']));

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

    private function accessUrl(ProjectCollaborator $collaborator): string
    {
        return route('project.invitations.show', $collaborator->access_token);
    }

    private function sendInvitationEmail(ProjectCollaborator $collaborator): ?string
    {
        try {
            $collaborator->loadMissing(['project', 'invitedBy']);
            Mail::send('emails.project-invitation', [
                'collaborator' => $collaborator,
                'invitationUrl' => $this->accessUrl($collaborator),
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
