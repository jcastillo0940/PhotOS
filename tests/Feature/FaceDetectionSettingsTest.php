<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\SaasPlan;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FaceDetectionSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_enable_tenant_wide_face_detection_for_new_projects(): void
    {
        SaasPlan::query()->firstOrCreate(
            ['code' => 'studio'],
            ['name' => 'Studio', 'description' => 'Plan base', 'features' => [], 'is_active' => true]
        );

        $tenant = Tenant::query()->create([
            'name' => 'Studio Face Detection',
            'slug' => 'studio-face-detection',
            'status' => 'active',
            'plan_code' => 'studio',
        ]);

        TenantDomain::query()->create([
            'tenant_id' => $tenant->id,
            'hostname' => 'face-detection.test',
            'type' => 'primary',
            'is_primary' => true,
        ]);

        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $this->actingAs($owner)
            ->post('http://face-detection.test/admin/face-detection/mode', [
                'mode' => 'all_galleries',
                'enable_existing_projects' => true,
            ])
            ->assertRedirect();

        $this->actingAs($owner)
            ->post('http://face-detection.test/admin/projects', [
                'client_name' => 'Cliente IA',
                'project_name' => 'Galeria IA Global',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('projects', [
            'tenant_id' => $tenant->id,
            'name' => 'Galeria IA Global',
            'face_recognition_enabled' => true,
        ]);

        $project = Project::query()->where('tenant_id', $tenant->id)->where('name', 'Galeria IA Global')->first();

        $this->assertNotNull($project);
    }
}
