<?php

namespace Tests\Feature;

use App\Models\SaasPlan;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SaasTenantUserAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_reassigned_user_appears_in_destination_tenant_access_list(): void
    {
        SaasPlan::query()->firstOrCreate(
            ['code' => 'studio'],
            [
                'name' => 'Studio',
                'description' => 'Plan base',
                'features' => [],
                'is_active' => true,
            ]
        );

        $originTenant = Tenant::query()->create([
            'name' => 'Laravel',
            'slug' => 'laravel-origen',
            'status' => 'active',
            'plan_code' => 'studio',
        ]);

        $destinationTenant = Tenant::query()->create([
            'name' => 'Misael Avdi',
            'slug' => 'misael-avdi-destino',
            'status' => 'active',
            'plan_code' => 'studio',
        ]);

        TenantDomain::query()->create([
            'tenant_id' => $destinationTenant->id,
            'hostname' => 'misael.test',
            'type' => 'primary',
            'is_primary' => true,
        ]);

        $admin = User::factory()->create([
            'tenant_id' => null,
            'role' => 'developer',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $originTenant->id,
            'role' => 'owner',
            'name' => 'Usuario Movido',
            'email' => 'movido@example.com',
        ]);

        $this->actingAs($admin)->put(route('admin.saas.users.update', $user), [
            'tenant_id' => (string) $destinationTenant->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'password' => '',
        ])->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'tenant_id' => $destinationTenant->id,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.saas.tenants.show', $destinationTenant))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Saas/Show')
                ->where('tenant.id', $destinationTenant->id)
                ->has('tenant.users', 1)
                ->where('tenant.users.0.id', $user->id)
                ->where('tenant.users.0.email', 'movido@example.com')
            );
    }
}
