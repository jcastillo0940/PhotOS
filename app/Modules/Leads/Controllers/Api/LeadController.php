<?php

namespace App\Modules\Leads\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\LeadResource;
use App\Models\Client;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LeadController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $leads = Lead::with('client', 'project')
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return LeadResource::collection($leads);
    }

    public function show(Lead $lead): LeadResource
    {
        return new LeadResource($lead->load('client', 'project'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|max:255',
            'event_type'     => 'nullable|string|max:255',
            'tentative_date' => 'nullable|date',
            'notes'          => 'nullable|string',
            'status'         => 'nullable|in:cold,warm,qualified,contacted,project',
        ]);

        $client = Client::firstOrCreate(
            ['email' => strtolower($data['email'])],
            ['full_name' => $data['name']]
        );

        $lead = Lead::create([
            'client_id'      => $client->id,
            'name'           => $data['name'],
            'email'          => strtolower($data['email']),
            'event_type'     => $data['event_type'] ?? null,
            'tentative_date' => $data['tentative_date'] ?? null,
            'notes'          => $data['notes'] ?? null,
            'status'         => $data['status'] ?? 'warm',
        ]);

        return (new LeadResource($lead->load('client')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Lead $lead): LeadResource
    {
        $data = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'email'          => 'sometimes|email|max:255',
            'event_type'     => 'sometimes|nullable|string|max:255',
            'tentative_date' => 'sometimes|nullable|date',
            'notes'          => 'sometimes|nullable|string',
            'status'         => 'sometimes|in:cold,warm,qualified,contacted,project',
        ]);

        $lead->update($data);

        return new LeadResource($lead->fresh()->load('client', 'project'));
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();

        return response()->json(['message' => 'Lead eliminado.']);
    }
}
