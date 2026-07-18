<?php

namespace App\Modules\Contracts\Policies;

use App\Models\Contract;
use App\Models\User;

class ContractPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['owner', 'operator']);
    }

    public function view(User $user, Contract $contract): bool
    {
        return $user->tenant_id === $contract->tenant_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['owner', 'operator']);
    }

    public function update(User $user, Contract $contract): bool
    {
        return $user->tenant_id === $contract->tenant_id
            && in_array($user->role, ['owner', 'operator']);
    }

    public function delete(User $user, Contract $contract): bool
    {
        return $user->tenant_id === $contract->tenant_id
            && $user->role === 'owner';
    }
}
