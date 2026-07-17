<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function view(User $user, Invoice $invoice): bool
    {
        if ($user->isDeveloper()) {
            return true;
        }

        if ((int) $user->tenant_id !== (int) $invoice->tenant_id) {
            return false;
        }

        return in_array($user->role, ['owner', 'operator'], true);
    }

    public function manage(User $user, Invoice $invoice): bool
    {
        if ($user->isDeveloper()) {
            return true;
        }

        if ((int) $user->tenant_id !== (int) $invoice->tenant_id) {
            return false;
        }

        return $user->canManageBilling();
    }

    public function create(User $user): bool
    {
        if ($user->isDeveloper()) {
            return true;
        }

        return $user->canManageBilling();
    }
}
