<?php

namespace App\Modules\Leads\Policies;

use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['owner', 'operator', 'photographer']);
    }

    public function view(User $user, Lead $lead): bool
    {
        return $user->tenant_id === $lead->tenant_id
            && in_array($user->role, ['owner', 'operator', 'photographer']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['owner', 'operator']);
    }

    public function update(User $user, Lead $lead): bool
    {
        return $user->tenant_id === $lead->tenant_id
            && in_array($user->role, ['owner', 'operator']);
    }

    public function delete(User $user, Lead $lead): bool
    {
        return $user->tenant_id === $lead->tenant_id
            && in_array($user->role, ['owner']);
    }
}
