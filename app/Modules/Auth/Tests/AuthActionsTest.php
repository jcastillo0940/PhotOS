<?php

namespace App\Modules\Auth\Tests;

use App\Modules\Auth\Actions\LoginAction;
use App\Modules\Auth\Actions\LogoutAction;
use App\Modules\Auth\Actions\IssueApiTokenAction;
use PHPUnit\Framework\TestCase;

class AuthActionsTest extends TestCase
{
    public function test_login_action_exists(): void
    {
        $this->assertTrue(class_exists(LoginAction::class));
    }

    public function test_logout_action_exists(): void
    {
        $this->assertTrue(class_exists(LogoutAction::class));
    }

    public function test_issue_api_token_action_exists(): void
    {
        $this->assertTrue(class_exists(IssueApiTokenAction::class));
    }
}
