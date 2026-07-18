<?php

namespace App\Modules\Gallery\Policies;

use App\Models\Photo;
use App\Models\User;

class PhotoPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['owner', 'operator', 'photographer']);
    }

    public function view(User $user, Photo $photo): bool
    {
        return $user->tenant_id === $photo->tenant_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['owner', 'operator', 'photographer']);
    }

    public function update(User $user, Photo $photo): bool
    {
        return $user->tenant_id === $photo->tenant_id
            && in_array($user->role, ['owner', 'operator', 'photographer']);
    }

    public function delete(User $user, Photo $photo): bool
    {
        return $user->tenant_id === $photo->tenant_id
            && in_array($user->role, ['owner', 'operator', 'photographer']);
    }
}
