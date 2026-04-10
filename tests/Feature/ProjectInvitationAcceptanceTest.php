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
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ProjectInvitationAcceptanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_photographer_can_accept_project_invitation_with_link_and_code(): void
    {
        SaasPlan::query()->firstOrCreate(
            ['code' => 'studio'],
            ['name' => 'Studio', 'description' => 'Plan base', 'features' => [], 'is_active' => true]
        );

        $tenant = Tenant::query()->create([
            'name' => 'Studio Invite',
            'slug' => 'studio-invite',
            'status' => 'active',
            'plan_code' => 'studio',
        ]);

        TenantDomain::query()->create([
            'tenant_id' => $tenant->id,
            'hostname' => 'invite.test',
            'type' => 'primary',
            'is_primary' => true,
        ]);

        $client = Client::query()->create(['tenant_id' => $tenant->id, 'full_name' => 'Cliente']);
        $lead = Lead::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'name' => 'Lead Proyecto',
            'email' => 'lead@example.com',
            'event_type' => 'Wedding',
            'status' => 'project',
        ]);

        $project = Project::query()->create([
            'tenant_id' => $tenant->id,
            'lead_id' => $lead->id,
            'client_id' => $client->id,
            'name' => 'Proyecto Invitacion',
            'status' => 'active',
            'gallery_token' => 'gallery-token-1',
            'gallery_password' => 'GAL123',
        ]);

        $photographer = User::factory()->create([
            'tenant_id' => null,
            'role' => 'photographer',
            'email' => 'photo@example.com',
        ]);

        $invitation = ProjectCollaborator::query()->create([
            'tenant_id' => $tenant->id,
            'project_id' => $project->id,
            'user_id' => $photographer->id,
            'invited_email' => $photographer->email,
            'role' => 'photographer',
            'status' => 'invited',
            'access_code' => 'ABC123',
            'access_token' => 'token-accept-123',
            'can_upload' => true,
            'can_manage_gallery' => false,
        ]);

        $this->actingAs($photographer)
            ->withServerVariables(['HTTP_HOST' => 'invite.test'])
            ->post(route('project.invitations.accept', $invitation->access_token), [
                'access_code' => 'ABC123',
            ])
            ->assertRedirect(route('admin.projects.gallery', $project->id));

        $this->assertDatabaseHas('project_collaborators', [
            'id' => $invitation->id,
            'status' => 'active',
            'user_id' => $photographer->id,
        ]);
    }

    public function test_owner_can_create_project_invitation(): void
    {
        Mail::fake();

        SaasPlan::query()->firstOrCreate(
            ['code' => 'studio'],
            ['name' => 'Studio', 'description' => 'Plan base', 'features' => [], 'is_active' => true]
        );

        $tenant = Tenant::query()->create([
            'name' => 'Studio Mail',
            'slug' => 'studio-mail',
            'status' => 'active',
            'plan_code' => 'studio',
        ]);

        TenantDomain::query()->create([
            'tenant_id' => $tenant->id,
            'hostname' => 'mail.test',
            'type' => 'primary',
            'is_primary' => true,
        ]);

        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $photographer = User::factory()->create([
            'tenant_id' => null,
            'role' => 'photographer',
            'email' => 'invited@example.com',
        ]);

        $client = Client::query()->create(['tenant_id' => $tenant->id, 'full_name' => 'Cliente']);
        $lead = Lead::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'name' => 'Lead Mail',
            'email' => 'lead-mail@example.com',
            'event_type' => 'Wedding',
            'status' => 'project',
        ]);

        $project = Project::query()->create([
            'tenant_id' => $tenant->id,
            'lead_id' => $lead->id,
            'client_id' => $client->id,
            'owner_user_id' => $owner->id,
            'name' => 'Proyecto Mail',
            'status' => 'active',
            'gallery_token' => 'gallery-token-mail',
            'gallery_password' => 'GAL123',
        ]);

        $this->actingAs($owner)
            ->post("http://mail.test/admin/projects/{$project->id}/collaborators", [
                'email' => $photographer->email,
                'can_upload' => true,
                'can_manage_gallery' => false,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('project_collaborators', [
            'project_id' => $project->id,
            'user_id' => $photographer->id,
            'status' => 'invited',
        ]);
    }

    public function test_owner_can_regenerate_and_revoke_invitation(): void
    {
        SaasPlan::query()->firstOrCreate(
            ['code' => 'studio'],
            ['name' => 'Studio', 'description' => 'Plan base', 'features' => [], 'is_active' => true]
        );

        $tenant = Tenant::query()->create([
            'name' => 'Studio Revoke',
            'slug' => 'studio-revoke',
            'status' => 'active',
            'plan_code' => 'studio',
        ]);

        TenantDomain::query()->create([
            'tenant_id' => $tenant->id,
            'hostname' => 'revoke.test',
            'type' => 'primary',
            'is_primary' => true,
        ]);

        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $photographer = User::factory()->create([
            'tenant_id' => null,
            'role' => 'photographer',
            'email' => 'revoke@example.com',
        ]);

        $client = Client::query()->create(['tenant_id' => $tenant->id, 'full_name' => 'Cliente']);
        $lead = Lead::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'name' => 'Lead Revoke',
            'email' => 'lead-revoke@example.com',
            'event_type' => 'Wedding',
            'status' => 'project',
        ]);

        $project = Project::query()->create([
            'tenant_id' => $tenant->id,
            'lead_id' => $lead->id,
            'client_id' => $client->id,
            'owner_user_id' => $owner->id,
            'name' => 'Proyecto Revoke',
            'status' => 'active',
            'gallery_token' => 'gallery-token-revoke',
            'gallery_password' => 'GAL123',
        ]);

        $collaborator = ProjectCollaborator::query()->create([
            'tenant_id' => $tenant->id,
            'project_id' => $project->id,
            'user_id' => $photographer->id,
            'invited_by_user_id' => $owner->id,
            'invited_email' => $photographer->email,
            'role' => 'photographer',
            'status' => 'active',
            'access_code' => 'OLD123',
            'access_token' => 'old-token-123',
            'can_upload' => true,
            'can_manage_gallery' => false,
            'accepted_at' => now(),
        ]);

        $this->actingAs($owner)
            ->post("http://revoke.test/admin/projects/{$project->id}/collaborators/{$collaborator->id}/regenerate")
            ->assertRedirect();

        $collaborator->refresh();
        $this->assertSame('invited', $collaborator->status);
        $this->assertNotSame('OLD123', $collaborator->access_code);
        $this->assertNotSame('old-token-123', $collaborator->access_token);

        $this->actingAs($owner)
            ->post("http://revoke.test/admin/projects/{$project->id}/collaborators/{$collaborator->id}/revoke")
            ->assertRedirect();

        $this->assertDatabaseHas('project_collaborators', [
            'id' => $collaborator->id,
            'status' => 'revoked',
        ]);
    }
}
