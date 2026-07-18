<?php

namespace App\Modules\MediaProcessing\Policies;

use App\Models\FaceIdentity;
use App\Models\User;

class FaceIdentityPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['owner', 'operator']);
    }

    public function view(User $user, FaceIdentity $identity): bool
    {
        return $user->tenant_id === $identity->tenant_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['owner', 'operator']);
    }

    public function update(User $user, FaceIdentity $identity): bool
    {
        return $user->tenant_id === $identity->tenant_id
            && in_array($user->role, ['owner', 'operator']);
    }

    public function delete(User $user, FaceIdentity $identity): bool
    {
        return $user->tenant_id === $identity->tenant_id
            && in_array($user->role, ['owner', 'operator']);
    }
}
