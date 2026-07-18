<?php

namespace App\Modules\Automations\Policies;

use App\Models\AutomationRule;
use App\Models\User;

class AutomationPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['owner', 'operator']);
    }

    public function view(User $user, AutomationRule $rule): bool
    {
        return $user->tenant_id === $rule->tenant_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['owner', 'operator']);
    }

    public function update(User $user, AutomationRule $rule): bool
    {
        return $user->tenant_id === $rule->tenant_id
            && in_array($user->role, ['owner', 'operator']);
    }

    public function delete(User $user, AutomationRule $rule): bool
    {
        return $user->tenant_id === $rule->tenant_id
            && $user->role === 'owner';
    }
}
