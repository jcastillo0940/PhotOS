<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureDeveloper;
use App\Http\Middleware\EnsureStudioOperator;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class OwnerPermissionsTest extends TestCase
{
    public function test_owner_is_not_treated_as_developer(): void
    {
        $owner = User::factory()->make([
            'role' => 'owner',
        ]);

        $developer = User::factory()->make([
            'role' => 'developer',
        ]);

        $this->assertFalse($owner->isDeveloper());
        $this->assertTrue($developer->isDeveloper());
    }

    public function test_developer_middleware_denies_owner(): void
    {
        $middleware = new EnsureDeveloper();
        $owner = User::factory()->make([
            'role' => 'owner',
        ]);

        $request = Request::create('/admin/saas/users', 'GET');
        $request->setUserResolver(fn () => $owner);

        $this->withoutExceptionHandling();

        $this->expectException(HttpException::class);

        $middleware->handle($request, fn () => new Response('ok'));
    }

    public function test_studio_operator_middleware_allows_owner_but_redirects_developer(): void
    {
        $middleware = new EnsureStudioOperator();

        $owner = User::factory()->make([
            'role' => 'owner',
        ]);

        $ownerRequest = Request::create('/admin/website', 'GET');
        $ownerRequest->setUserResolver(fn () => $owner);

        $ownerResponse = $middleware->handle($ownerRequest, fn () => new Response('ok'));

        $this->assertSame(200, $ownerResponse->getStatusCode());

        $developer = User::factory()->make([
            'role' => 'developer',
        ]);

        $developerRequest = Request::create('/admin/website', 'GET');
        $developerRequest->setUserResolver(fn () => $developer);

        $developerResponse = $middleware->handle($developerRequest, fn () => new Response('ok'));

        $this->assertSame(302, $developerResponse->getStatusCode());
    }
}
