<?php

namespace App\Modules\Auth\Actions;

use App\Models\User;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\NewAccessToken;

class IssueApiTokenAction
{
    public function execute(User $user, string $name, ?int $expiresInDays): NewAccessToken
    {
        $expiresAt = $expiresInDays ? Carbon::now()->addDays($expiresInDays) : null;

        return $user->createToken($name, ['*'], $expiresAt);
    }
}
