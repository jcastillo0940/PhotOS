<?php

namespace Tests\Feature;

use App\Models\SaasPlan;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * E2E login tests covering the redirect-loop bug:
 * A global (tenant_id=null) developer/operator user visiting a tenant domain
 * was immediately logged out by EnsureTenantSessionMatchesHost because
 * (int)(null??0) !== (int)$tenantId, causing an infinite login loop.
 *
 * NOTE: We pass full URLs (http://studio.test/admin) to test methods so that
 * Symfony's Request::create sets HTTP_HOST correctly for ResolveTenantFromHost.
 */
class LoginRedirectLoopTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private string $tenantHost = 'studio.test';
    private string $centralHost = 'app.test';

    protected function setUp(): void
    {
        parent::setUp();

        config(['saas.central_domains' => [$this->centralHost]]);

        SaasPlan::query()->firstOrCreate(
            ['code' => 'studio'],
            ['name' => 'Studio', 'description' => '-', 'features' => [], 'is_active' => true]
        );

        $this->tenant = Tenant::query()->create([
            'name' => 'Test Studio',
            'slug' => 'test-studio',
            'status' => 'active',
            'plan_code' => 'studio',
        ]);

        TenantDomain::query()->create([
            'tenant_id' => $this->tenant->id,
            'hostname' => $this->tenantHost,
            'type' => 'primary',
            'is_primary' => true,
        ]);
    }

    // ─── Developer on tenant domain ───────────────────────────────────────────

    public function test_developer_can_post_login_on_tenant_domain(): void
    {
        $developer = User::factory()->create([
            'tenant_id' => null,
            'role' => 'developer',
            'email' => 'dev@example.com',
            'password' => bcrypt('secret'),
        ]);

        $response = $this->post(
            'http://' . $this->tenantHost . '/login',
            ['email' => 'dev@example.com', 'password' => 'secret']
        );

        $location = (string) $response->headers->get('Location');
        $this->assertStringNotContainsString('/login', $location,
            'Developer POST /login was bounced back to /login (redirect loop)');
        $this->assertAuthenticatedAs($developer);
    }

    public function test_developer_is_not_kicked_out_after_login_on_tenant_domain(): void
    {
        $developer = User::factory()->create([
            'tenant_id' => null,
            'role' => 'developer',
        ]);

        $response = $this->actingAs($developer)
            ->get('http://' . $this->tenantHost . '/admin');

        $location = (string) $response->headers->get('Location');
        $this->assertStringNotContainsString('/login', $location,
            'Developer was redirected to login on tenant domain (infinite loop bug)');
        $response->assertOk();
    }

    // ─── Operator on tenant domain ────────────────────────────────────────────

    public function test_operator_is_not_kicked_out_on_tenant_domain(): void
    {
        $operator = User::factory()->create([
            'tenant_id' => null,
            'role' => 'operator',
        ]);

        $response = $this->actingAs($operator)
            ->get('http://' . $this->tenantHost . '/admin');

        $location = (string) $response->headers->get('Location');
        $this->assertStringNotContainsString('/login', $location,
            'Operator was redirected to login on tenant domain (infinite loop bug)');
        $response->assertOk();
    }

    // ─── Tenant owner on their own domain ─────────────────────────────────────

    public function test_tenant_owner_can_access_their_domain(): void
    {
        $owner = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'role' => 'owner',
        ]);

        $response = $this->actingAs($owner)
            ->get('http://' . $this->tenantHost . '/admin');

        $location = (string) $response->headers->get('Location');
        $this->assertStringNotContainsString('/login', $location,
            'Tenant owner was redirected to login on their own domain');
        $response->assertOk();
    }

    // ─── Tenant owner on wrong domain gets kicked out ─────────────────────────

    public function test_tenant_owner_from_different_tenant_is_kicked_on_wrong_domain(): void
    {
        $otherTenant = Tenant::query()->create([
            'name' => 'Other Studio',
            'slug' => 'other-studio',
            'status' => 'active',
            'plan_code' => 'studio',
        ]);

        $owner = User::factory()->create([
            'tenant_id' => $otherTenant->id,
            'role' => 'owner',
        ]);

        $response = $this->actingAs($owner)
            ->get('http://' . $this->tenantHost . '/admin');

        $location = (string) $response->headers->get('Location');
        $this->assertStringContainsString('/login', $location,
            'Owner from wrong tenant should be kicked out');
    }

    // ─── Developer on central domain ──────────────────────────────────────────

    public function test_developer_can_access_central_domain(): void
    {
        $developer = User::factory()->create([
            'tenant_id' => null,
            'role' => 'developer',
        ]);

        $response = $this->actingAs($developer)
            ->get('http://' . $this->centralHost . '/admin');

        $location = (string) $response->headers->get('Location');
        $this->assertStringNotContainsString('/login', $location,
            'Developer was redirected to login on central domain');
        $response->assertOk();
    }

    // ─── Login credentials scope ──────────────────────────────────────────────

    public function test_tenant_user_cannot_login_on_another_tenants_domain(): void
    {
        $otherTenant = Tenant::query()->create([
            'name' => 'Other Studio',
            'slug' => 'other-studio',
            'status' => 'active',
            'plan_code' => 'studio',
        ]);

        User::factory()->create([
            'tenant_id' => $otherTenant->id,
            'role' => 'owner',
            'email' => 'wrong@other.test',
            'password' => bcrypt('secret'),
        ]);

        $response = $this->post(
            'http://' . $this->tenantHost . '/login',
            ['email' => 'wrong@other.test', 'password' => 'secret']
        );

        $response->assertSessionHasErrors('auth');
        $this->assertGuest();
    }
}
