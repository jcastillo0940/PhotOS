<?php

namespace Tests\Feature;

use App\Models\SaasPlan;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\User;
use App\Services\Saas\CloudflareCustomHostnameService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Tests\TestCase;

class CustomDomainOnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_signup_creates_custom_domain_when_plan_allows_it(): void
    {
        config()->set('saas.central_domains', ['photos.test']);

        SaasPlan::query()->create([
            'code' => 'pro',
            'name' => 'Pro',
            'description' => 'Plan Pro',
            'features' => [
                'custom_domain' => true,
                'price_monthly' => 49,
                'price_yearly' => 490,
            ],
            'is_active' => true,
        ]);

        $this->mock(CloudflareCustomHostnameService::class, function (MockInterface $mock) {
            $mock->shouldReceive('enabled')->andReturn(true);
            $mock->shouldReceive('createCustomHostname')->once()->andReturn([]);
        });

        $response = $this->post('/get-started', [
            'studio_name' => 'Studio Pro',
            'slug' => 'studio-pro',
            'owner_name' => 'Owner Pro',
            'owner_email' => 'owner-pro@example.com',
            'owner_phone' => '+50760000000',
            'owner_password' => 'password123',
            'plan_code' => 'pro',
            'billing_cycle' => 'monthly',
            'preset_key' => null,
            'requested_domain' => 'fotos.mistudio.com',
            'payment_gateway' => 'manual',
            'terms' => '1',
        ]);

        $response->assertRedirect();

        $tenant = Tenant::query()->where('slug', 'studio-pro')->firstOrFail();

        $this->assertDatabaseHas('tenant_domains', [
            'tenant_id' => $tenant->id,
            'hostname' => 'studio-pro.photos.test',
            'type' => 'subdomain',
            'is_primary' => true,
        ]);

        $this->assertDatabaseHas('tenant_domains', [
            'tenant_id' => $tenant->id,
            'hostname' => 'fotos.mistudio.com',
            'type' => 'custom',
        ]);
    }

    public function test_tenant_owner_can_add_custom_domain_from_subscription_portal(): void
    {
        SaasPlan::query()->create([
            'code' => 'business',
            'name' => 'Business',
            'description' => 'Plan Business',
            'features' => [
                'custom_domain' => true,
                'price_monthly' => 99,
                'price_yearly' => 990,
            ],
            'is_active' => true,
        ]);

        $tenant = Tenant::query()->create([
            'name' => 'Tenant Business',
            'slug' => 'tenant-business',
            'status' => 'active',
            'plan_code' => 'business',
            'custom_domain_enabled' => true,
        ]);

        TenantDomain::query()->create([
            'tenant_id' => $tenant->id,
            'hostname' => 'tenant-business.photos.test',
            'type' => 'primary',
            'is_primary' => true,
            'cf_status' => 'internal',
        ]);

        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $this->mock(CloudflareCustomHostnameService::class, function (MockInterface $mock) {
            $mock->shouldReceive('enabled')->andReturn(true);
            $mock->shouldReceive('managedCnameTarget')->andReturn('custom-hostname.photos.test');
            $mock->shouldReceive('createCustomHostname')->once()->andReturn([]);
        });

        $response = $this->actingAs($owner)->post('http://tenant-business.photos.test/admin/subscription/custom-domain', [
            'hostname' => 'galeria.micliente.com',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('tenant_domains', [
            'tenant_id' => $tenant->id,
            'hostname' => 'galeria.micliente.com',
            'type' => 'custom',
        ]);

        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'custom_domain' => 'galeria.micliente.com',
        ]);
    }
}
