<?php

namespace App\Http\Controllers;

use App\Models\ProjectCollaborator;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectInvitationController extends Controller
{
    public function show(Request $request, string $token)
    {
        $collaborator = ProjectCollaborator::withoutGlobalScope('tenant')
            ->with(['project', 'user'])
            ->where('access_token', $token)
            ->firstOrFail();

        return Inertia::render('Public/ProjectInvitation', [
            'invitation' => [
                'token' => $collaborator->access_token,
                'status' => $collaborator->status,
                'invited_email' => $collaborator->invited_email,
                'access_code_hint' => 'Ingresa el codigo compartido por el owner u operator.',
                'project' => [
                    'id' => $collaborator->project?->id,
                    'name' => $collaborator->project?->name,
                ],
            ],
            'authState' => [
                'is_authenticated' => (bool) $request->user(),
                'is_photographer' => (bool) $request->user()?->isPhotographer(),
                'email_matches' => $request->user()?->email === $collaborator->invited_email,
                'login_url' => route('login', ['redirect' => $request->fullUrl()]),
            ],
        ]);
    }

    public function accept(Request $request, string $token)
    {
        $user = $request->user();
        abort_unless($user && $user->isPhotographer(), 403, 'Solo un fotografo puede aceptar esta invitacion.');

        $collaborator = ProjectCollaborator::withoutGlobalScope('tenant')
            ->with('project')
            ->where('access_token', $token)
            ->firstOrFail();

        if ($collaborator->status === 'revoked') {
            return back()->with('error', 'Esta invitacion fue revocada por el owner u operator.');
        }

        $validated = $request->validate([
            'access_code' => 'required|string|max:32',
        ]);

        if ($user->email !== $collaborator->invited_email) {
            return back()->with('error', 'Debes iniciar sesion con el correo del fotografo invitado.');
        }

        if (!hash_equals((string) $collaborator->access_code, strtoupper(trim((string) $validated['access_code'])))) {
            return back()->with('error', 'El codigo de acceso no es valido.');
        }

        $collaborator->update([
            'status' => 'active',
            'accepted_at' => now(),
            'user_id' => $user->id,
        ]);

        return redirect()
            ->route('admin.projects.gallery', $collaborator->project_id)
            ->with('success', 'Invitacion aceptada. Ya puedes trabajar en este proyecto.');
    }
}
