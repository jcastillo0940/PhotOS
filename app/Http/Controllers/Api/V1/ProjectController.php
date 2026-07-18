<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\PhotoResource;
use App\Http\Resources\Api\ProjectResource;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Project;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $projects = Project::with('client')
            ->withCount('photos')
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return ProjectResource::collection($projects);
    }

    public function show(Project $project): ProjectResource
    {
        return new ProjectResource($project->load('client')->loadCount('photos'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'client_name'  => 'required|string|max:255',
            'client_email' => 'nullable|email|max:255',
            'event_date'   => 'nullable|date',
            'location'     => 'nullable|string|max:255',
            'status'       => 'nullable|in:active,archived',
        ]);

        $tenant = app(TenantContext::class)->tenant();
        $projectLimit = $tenant?->featureLimit('projects_limit');
        if ($projectLimit !== null && Project::count() >= (int) $projectLimit) {
            return response()->json([
                'message' => "Limite de proyectos alcanzado ({$projectLimit}). Sube tu plan para continuar.",
            ], 422);
        }

        $email = $data['client_email']
            ?? strtolower(str_replace(' ', '', $data['client_name'])) . '@client.local';

        $client = Client::firstOrCreate(
            ['email' => $email],
            ['full_name' => $data['client_name']]
        );

        $lead = Lead::create([
            'client_id'  => $client->id,
            'name'       => $data['client_name'],
            'email'      => $email,
            'event_type' => 'API Upload',
            'status'     => 'project',
        ]);

        $project = Project::create([
            'lead_id'              => $lead->id,
            'client_id'            => $client->id,
            'owner_user_id'        => $request->user()?->id,
            'name'                 => $data['name'],
            'status'               => $data['status'] ?? 'active',
            'event_date'           => $data['event_date'] ?? null,
            'location'             => $data['location'] ?? null,
            'gallery_token'        => Str::random(40),
            'gallery_password'     => strtoupper(Str::random(8)),
            'face_recognition_enabled' => false,
            'selected_sponsors'    => [],
        ]);

        return (new ProjectResource($project->load('client')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Project $project): ProjectResource
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'status'     => 'sometimes|in:active,archived',
            'event_date' => 'sometimes|nullable|date',
            'location'   => 'sometimes|nullable|string|max:255',
        ]);

        $project->update($data);

        return new ProjectResource($project->fresh()->load('client')->loadCount('photos'));
    }

    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json(['message' => 'Proyecto eliminado.']);
    }

    public function photos(Request $request, Project $project): AnonymousResourceCollection
    {
        $photos = $project->photos()
            ->when($request->is_selected !== null, fn ($q) => $q->where('is_selected', (bool) $request->is_selected))
            ->orderBy('order_index')
            ->paginate($request->integer('per_page', 50));

        return PhotoResource::collection($photos);
    }
}
