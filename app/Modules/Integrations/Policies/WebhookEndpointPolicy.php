<?php

namespace App\Modules\Integrations\Policies;

use App\Models\User;
use App\Models\WebhookEndpoint;

class WebhookEndpointPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['owner', 'operator']);
    }

    public function view(User $user, WebhookEndpoint $endpoint): bool
    {
        return $user->tenant_id === $endpoint->tenant_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['owner', 'operator']);
    }

    public function update(User $user, WebhookEndpoint $endpoint): bool
    {
        return $user->tenant_id === $endpoint->tenant_id
            && in_array($user->role, ['owner', 'operator']);
    }

    public function delete(User $user, WebhookEndpoint $endpoint): bool
    {
        return $user->tenant_id === $endpoint->tenant_id
            && $user->role === 'owner';
    }
}
