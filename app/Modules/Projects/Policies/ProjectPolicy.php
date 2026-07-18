<?php

namespace App\Modules\Projects\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function view(User $user, Project $project): bool
    {
        return $project->userCan($user, 'view');
    }

    public function upload(User $user, Project $project): bool
    {
        return $project->userCan($user, 'upload');
    }

    public function manageGallery(User $user, Project $project): bool
    {
        return $project->userCan($user, 'manage_gallery');
    }

    public function update(User $user, Project $project): bool
    {
        return $project->userCan($user, 'manage_gallery');
    }

    public function delete(User $user, Project $project): bool
    {
        return $project->userCan($user, 'manage_gallery');
    }

    public function finance(User $user, Project $project): bool
    {
        if ($user->isDeveloper()) {
            return true;
        }

        return in_array($user->role, ['owner', 'operator'], true)
            && (int) $user->tenant_id === (int) $project->tenant_id
            && $user->canManageBilling();
    }
}
