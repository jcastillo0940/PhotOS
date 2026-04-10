<?php

namespace App\Http\Controllers;

use App\Models\FaceIdentity;
use App\Models\Project;
use App\Models\Setting;
use App\Services\FaceRecognitionService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class FaceDetectionController extends Controller
{
    public function __construct(
        private readonly FaceRecognitionService $faceRecognitionService,
        private readonly TenantContext $tenantContext,
    ) {}

    public function index()
    {
        $tenantId = $this->tenantContext->id();

        $projects = Project::query()
            ->with('lead')
            ->withCount('photos')
            ->latest()
            ->get();

        $identities = FaceIdentity::withoutGlobalScope('tenant')
            ->with('project:id,name')
            ->where('tenant_id', $tenantId)
            ->latest()
            ->get()
            ->map(fn (FaceIdentity $identity) => [
                'id' => $identity->id,
                'name' => $identity->name,
                'scope' => $identity->project_id ? 'project' : 'global',
                'project_id' => $identity->project_id,
                'project_name' => $identity->project?->name,
                'processing_status' => $identity->processing_status,
                'processing_note' => $identity->processing_note,
                'processed_at' => optional($identity->processed_at)?->toIso8601String(),
                'preview_url' => $this->previewUrl($identity->path_reference),
            ])
            ->values();

        $projectSummaries = $projects->map(fn (Project $project) => [
            'id' => $project->id,
            'name' => $project->name,
            'event_type' => $project->lead?->event_type,
            'client_name' => $project->lead?->name,
            'face_recognition_enabled' => (bool) $project->face_recognition_enabled,
            'photos_count' => (int) $project->photos_count,
            'detected_people_count' => (int) $project->photos()->whereNotNull('people_tags')->get()->sum(fn ($photo) => count($photo->people_tags ?? [])),
            'local_identities_count' => FaceIdentity::withoutGlobalScope('tenant')->where('tenant_id', $tenantId)->where('project_id', $project->id)->count(),
            'database_ready' => $this->faceRecognitionService->hasRecognitionDatabase($project),
            'workspace_url' => "/admin/projects/{$project->id}/ai",
        ])->values();

        $photos = $projects->flatMap->photos;

        return Inertia::render('Admin/FaceDetection/Index', [
            'mode' => Setting::get('face_detection_scope', 'project_only'),
            'serviceConfigured' => $this->faceRecognitionService->enabled(),
            'projects' => $projectSummaries,
            'identities' => $identities,
            'stats' => [
                'projects_count' => $projects->count(),
                'photos_count' => $photos->count(),
                'global_identities_count' => $identities->where('scope', 'global')->count(),
                'local_identities_count' => $identities->where('scope', 'project')->count(),
                'photos_with_people' => $photos->filter(fn ($photo) => !empty($photo->people_tags))->count(),
                'photos_pending' => $photos->filter(fn ($photo) => blank($photo->recognition_status) || $photo->recognition_status === 'pending')->count(),
            ],
        ]);
    }

    public function updateMode(Request $request)
    {
        $validated = $request->validate([
            'mode' => 'required|string|in:project_only,all_galleries',
            'enable_existing_projects' => 'nullable|boolean',
        ]);

        Setting::set('face_detection_scope', $validated['mode'], 'ai');

        if ($validated['mode'] === 'all_galleries' && ($validated['enable_existing_projects'] ?? false)) {
            Project::query()->update(['face_recognition_enabled' => true]);
        }

        return back(status: 303)->with('success', 'Modo de deteccion facial actualizado.');
    }

    public function storeIdentity(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'scope' => 'required|string|in:global,project',
            'project_id' => 'nullable|integer|exists:projects,id',
            'reference_image' => 'required|image|mimes:jpeg,jpg,png,webp|max:10000',
        ]);

        $project = null;

        if ($validated['scope'] === 'project') {
            $project = Project::query()->findOrFail($validated['project_id'] ?? null);
        }

        $tenantId = $this->tenantContext->id();
        $directory = $project
            ? 'tenants/'.$tenantId.'/projects/'.$project->id.'/face-identities'
            : 'tenants/'.$tenantId.'/face-identities/global';

        $file = $request->file('reference_image');
        $storedPath = $file->storeAs(
            $directory,
            uniqid('identity_', true).'.'.strtolower($file->getClientOriginalExtension() ?: 'jpg'),
            'r2'
        );

        $identity = FaceIdentity::create([
            'tenant_id' => $tenantId,
            'project_id' => $project?->id,
            'name' => trim((string) $validated['name']),
            'embedding' => null,
            'path_reference' => $storedPath,
            'processing_status' => 'pending',
            'processing_note' => $project
                ? 'Rostro enviado para procesar en esta galeria.'
                : 'Rostro global enviado para procesar en todo el tenant.',
        ]);

        $this->faceRecognitionService->dispatchTenantIdentityExtraction($identity);

        return back(status: 303)->with('success', 'Rostro registrado. El motor IA lo procesara en segundo plano.');
    }

    public function destroyIdentity(FaceIdentity $faceIdentity)
    {
        abort_unless((int) $faceIdentity->tenant_id === (int) $this->tenantContext->id(), 404);

        if ($faceIdentity->path_reference) {
            Storage::disk('r2')->delete($faceIdentity->path_reference);
        }

        $name = $faceIdentity->name;
        $faceIdentity->delete();

        Project::query()->with('photos')->get()->each(function (Project $project) use ($name) {
            foreach ($project->photos as $photo) {
                $photo->update([
                    'people_tags' => collect($photo->people_tags ?? [])
                        ->reject(fn ($tag) => strcasecmp((string) $tag, (string) $name) === 0)
                        ->values()
                        ->all(),
                ]);
            }
        });

        return back(status: 303)->with('success', 'Rostro eliminado del tenant.');
    }

    public function runAll()
    {
        $mode = Setting::get('face_detection_scope', 'project_only');
        $projects = Project::query()->with('photos')->get();
        $queuedProjects = 0;
        $queuedPhotos = 0;

        foreach ($projects as $project) {
            if ($mode === 'all_galleries' && !$project->face_recognition_enabled) {
                $project->update(['face_recognition_enabled' => true]);
            }

            if (!$project->face_recognition_enabled && $mode !== 'all_galleries') {
                continue;
            }

            if ($project->photos->isEmpty() || !$this->faceRecognitionService->hasRecognitionDatabase($project)) {
                continue;
            }

            $queuedProjects++;
            $queuedPhotos += $this->faceRecognitionService->dispatchProjectRecognition($project);
        }

        return back(status: 303)->with('success', "Se enviaron {$queuedPhotos} fotos de {$queuedProjects} galerias a la cola IA.");
    }

    private function previewUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        try {
            return Storage::disk('r2')->temporaryUrl($path, now()->addMinutes(30));
        } catch (\Throwable $e) {
            return $path;
        }
    }
}
