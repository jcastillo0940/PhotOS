<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Lead;
use App\Models\Project;
use App\Models\ProjectCollaborator;
use App\Models\SaasPlan;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectWorkspaceRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_opens_project_and_gets_details_workspace(): void
    {
        SaasPlan::query()->firstOrCreate(
            ['code' => 'studio'],
            ['name' => 'Studio', 'description' => 'Plan base', 'features' => [], 'is_active' => true]
        );

        $tenant = Tenant::query()->create([
            'name' => 'Studio Redirect',
            'slug' => 'studio-redirect',
            'status' => 'active',
            'plan_code' => 'studio',
        ]);

        TenantDomain::query()->create([
            'tenant_id' => $tenant->id,
            'hostname' => 'redirect.test',
            'type' => 'primary',
            'is_primary' => true,
        ]);

        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $client = Client::query()->create([
            'tenant_id' => $tenant->id,
            'full_name' => 'Cliente Owner',
        ]);

        $lead = Lead::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'name' => 'Lead Owner',
            'email' => 'lead-owner@example.com',
            'event_type' => 'Wedding',
            'status' => 'project',
        ]);

        $project = Project::query()->create([
            'tenant_id' => $tenant->id,
            'lead_id' => $lead->id,
            'client_id' => $client->id,
            'name' => 'Proyecto Owner',
            'status' => 'active',
            'gallery_token' => 'gallery-owner-token',
            'gallery_password' => 'OWNER123',
        ]);

        $response = $this->actingAs($owner)->get("http://redirect.test/admin/projects/{$project->id}");

        $response->assertRedirect("http://redirect.test/admin/projects/{$project->id}/details");
    }

    public function test_photographer_opens_project_and_gets_gallery_workspace(): void
    {
        SaasPlan::query()->firstOrCreate(
            ['code' => 'studio'],
            ['name' => 'Studio', 'description' => 'Plan base', 'features' => [], 'is_active' => true]
        );

        $tenant = Tenant::query()->create([
            'name' => 'Studio Redirect Photo',
            'slug' => 'studio-redirect-photo',
            'status' => 'active',
            'plan_code' => 'studio',
        ]);

        TenantDomain::query()->create([
            'tenant_id' => $tenant->id,
            'hostname' => 'redirect-photo.test',
            'type' => 'primary',
            'is_primary' => true,
        ]);

        $photographer = User::factory()->create([
            'tenant_id' => null,
            'role' => 'photographer',
        ]);

        $client = Client::query()->create([
            'tenant_id' => $tenant->id,
            'full_name' => 'Cliente Foto',
        ]);

        $lead = Lead::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'name' => 'Lead Foto',
            'email' => 'lead-photo@example.com',
            'event_type' => 'Wedding',
            'status' => 'project',
        ]);

        $project = Project::query()->create([
            'tenant_id' => $tenant->id,
            'lead_id' => $lead->id,
            'client_id' => $client->id,
            'name' => 'Proyecto Fotografo',
            'status' => 'active',
            'gallery_token' => 'gallery-photo-token',
            'gallery_password' => 'PHOTO123',
        ]);

        ProjectCollaborator::create([
            'tenant_id' => $tenant->id,
            'project_id' => $project->id,
            'user_id' => $photographer->id,
            'invited_email' => $photographer->email,
            'role' => 'photographer',
            'status' => 'active',
            'can_upload' => true,
            'can_manage_gallery' => false,
            'access_code' => 'ABC12345',
            'access_token' => str_repeat('a', 40),
        ]);

        $response = $this->actingAs($photographer)->get("http://redirect-photo.test/admin/projects/{$project->id}");

        $response->assertRedirect("http://redirect-photo.test/admin/projects/{$project->id}/gallery");
    }
}
