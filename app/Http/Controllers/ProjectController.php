<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\Event;
use App\Models\Lead;
use App\Models\Project;
use App\Support\GalleryTemplate;
use App\Support\InstallationPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Projects/Index', [
            'projects' => Project::with('lead', 'contract')->latest()->get(),
            'installationPlan' => InstallationPlan::current(),
        ]);
    }

    public function show(Project $project)
    {
        if (!$project->gallery_token) {
            $project->update(['gallery_token' => Str::random(40)]);
        }

        $project->load('lead', 'contract', 'invoices', 'photos', 'heroPhoto');
        $serializedPhotos = $project->photos->map(fn ($photo) => $this->serializePhotoForAdmin($photo))->values();

        return Inertia::render('Admin/Projects/Show', [
            'project' => [
                ...$project->toArray(),
                'photos' => $serializedPhotos,
                'heroPhoto' => $project->heroPhoto ? $this->serializePhotoForAdmin($project->heroPhoto) : null,
                'originals_usage_bytes' => $project->originalsUsageBytes(),
                'high_res_available' => $project->highResAvailable(),
            ],
            'installationPlan' => InstallationPlan::current(),
            'availableTemplates' => $this->availableTemplatesForCurrentPlan(),
        ]);
    }

    public function storeDirect(Request $request)
    {
        $request->validate([
            'client_name' => 'required|string|max:255',
            'project_name' => 'required|string|max:255',
        ]);

        $lead = Lead::create([
            'name' => $request->client_name,
            'email' => strtolower(str_replace(' ', '', $request->client_name)) . '-' . rand(100,999) . '@upload.dummy',
            'event_type' => 'Direct Upload',
            'status' => 'project',
        ]);

        $plan = InstallationPlan::current();

        $project = Project::create([
            'lead_id' => $lead->id,
            'owner_user_id' => $request->user()?->id,
            'name' => $request->project_name,
            'status' => 'active',
            'gallery_token' => Str::random(40),
            'gallery_password' => null,
            'download_limit' => $plan['weekly_download_limit'] ?? null,
            'weekly_download_limit' => $plan['weekly_download_limit'] ?? null,
            'downloads_window_started_at' => now(),
            'retention_days' => $plan['retention_days'] ?? null,
            'storage_limit_bytes' => $this->gigabytesToBytes($plan['storage_limit_gb'] ?? null),
            'originals_expires_at' => isset($plan['retention_days']) ? now()->addDays($plan['retention_days']) : null,
            'gallery_template_code' => GalleryTemplate::firstAllowedCode($plan),
        ]);

        return redirect()->route('admin.projects.show', $project, 303);
    }

    public function convert(Lead $lead)
    {
        if (Project::where('lead_id', $lead->id)->exists()) {
            return redirect()->back()->with('error', 'Lead already converted.');
        }

        $plan = InstallationPlan::current();

        $project = Project::create([
            'lead_id' => $lead->id,
            'owner_user_id' => request()->user()?->id,
            'name' => 'Project: ' . $lead->name . ' (' . $lead->event_type . ')',
            'event_date' => $lead->tentative_date,
            'status' => 'pending_payment',
            'gallery_token' => Str::random(40),
            'gallery_password' => null,
            'download_limit' => $plan['weekly_download_limit'] ?? null,
            'weekly_download_limit' => $plan['weekly_download_limit'] ?? null,
            'downloads_window_started_at' => now(),
            'retention_days' => $plan['retention_days'] ?? null,
            'storage_limit_bytes' => $this->gigabytesToBytes($plan['storage_limit_gb'] ?? null),
            'originals_expires_at' => isset($plan['retention_days']) ? now()->addDays($plan['retention_days']) : null,
            'gallery_template_code' => GalleryTemplate::firstAllowedCode($plan),
        ]);

        $lead->update(['status' => 'project']);

        if ($project->event_date) {
            Event::create([
                'project_id' => $project->id,
                'title' => 'Session: ' . $project->name,
                'start' => $project->event_date->startOfDay()->addHours(10),
                'end' => $project->event_date->startOfDay()->addHours(18),
                'type' => 'session',
            ]);
        }

        $this->generateContract($project);

        return redirect()->route('admin.projects.show', $project, 303);
    }

    public function generateContract(Project $project)
    {
        Contract::updateOrCreate(
            ['project_id' => $project->id],
            [
                'content' => "<h1>Photography Service Agreement</h1><p>Client: <strong>{$project->lead->name}</strong></p><p>Event Date: <strong>" . ($project->event_date?->toDateString() ?? 'TBD') . "</strong></p>",
                'status' => 'pending',
                'token' => Str::random(40),
            ]
        );
        return redirect()->back()->with('success', 'Contract generated successfully.');
    }

    public function publicSignatureView($token)
    {
        $contract = Contract::where('token', $token)->with('project.lead')->firstOrFail();
        if ($contract->status === 'signed') return Inertia::render('Public/ContractSigned', ['contract' => $contract]);
        return Inertia::render('Public/SignContract', ['contract' => $contract]);
    }

    public function signContract(Request $request, $token)
    {
        $contract = Contract::where('token', $token)->firstOrFail();
        $request->validate(['signature_data' => 'required|string']);
        $contract->update(['status' => 'signed', 'signed_at' => now(), 'signature_data' => $request->signature_data]);
        return redirect()->back();
    }

    public function updateRoadmap(Request $request, Project $project)
    {
        $validated = $request->validate(['roadmap' => 'required|array']);
        $project->update($validated);
        return to_route('admin.projects.show', $project, 303);
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'hero_photo_id' => 'nullable|integer|exists:photos,id',
            'hero_focus_x' => 'nullable|string|max:10',
            'hero_focus_y' => 'nullable|string|max:10',
            'gallery_template_code' => 'nullable|string|max:100',
        ]);

        $payload = [];

        if (array_key_exists('hero_photo_id', $validated)) {
            $heroPhoto = $validated['hero_photo_id']
                ? $project->photos()->whereKey($validated['hero_photo_id'])->first()
                : null;

            if ($validated['hero_photo_id'] && !$heroPhoto) {
                return redirect()->back()->with('error', 'La foto seleccionada no pertenece a este proyecto.');
            }

            $payload['hero_photo_id'] = $heroPhoto?->id;
        }

        if (array_key_exists('hero_focus_x', $validated)) {
            $payload['hero_focus_x'] = $validated['hero_focus_x'] ?? '50%';
        }

        if (array_key_exists('hero_focus_y', $validated)) {
            $payload['hero_focus_y'] = $validated['hero_focus_y'] ?? '50%';
        }

        if (array_key_exists('gallery_template_code', $validated) && $validated['gallery_template_code']) {
            $payload['gallery_template_code'] = GalleryTemplate::isAllowedForPlan($validated['gallery_template_code'], $project->planDefinition())
                ? $validated['gallery_template_code']
                : GalleryTemplate::firstAllowedCode($project->planDefinition());
        }

        if (!empty($payload)) {
            $project->update($payload);
        }

        return to_route('admin.projects.show', $project, 303)->with('success', 'Proyecto actualizado.');
    }

    private function gigabytesToBytes(?float $gigabytes): ?int
    {
        if ($gigabytes === null) {
            return null;
        }

        return (int) round($gigabytes * 1024 * 1024 * 1024);
    }

    private function serializePhotoForAdmin($photo): array
    {
        $resolvedUrl = $photo->optimized_path
            ? $this->temporaryUrlOrFallback($photo->optimized_path)
            : $photo->url;

        return [
            ...$photo->toArray(),
            'url' => $resolvedUrl,
            'thumbnail_url' => $resolvedUrl,
        ];
    }

    private function temporaryUrlOrFallback(string $path): string
    {
        try {
            return Storage::disk('r2')->temporaryUrl($path, now()->addMinutes(60));
        } catch (\Throwable $e) {
            return $path;
        }
    }

    private function availableTemplatesForCurrentPlan(): array
    {
        $plan = InstallationPlan::current();
        $allowed = $plan['template_access'] ?? 'all';

        return collect(GalleryTemplate::all())
            ->filter(fn (array $template) => $allowed === 'all' || in_array($template['id'] ?? null, $allowed, true))
            ->values()
            ->all();
    }
}
