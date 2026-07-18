<?php

namespace App\Http\Controllers;

use App\Jobs\DeleteProjectJob;
use App\Models\Client;
use App\Models\Contract;
use App\Models\DownloadLog;
use App\Models\Event;
use App\Models\FaceIdentity;
use App\Models\GalleryEmailRegistration;
use App\Models\GalleryFavorite;
use App\Models\GalleryFavoriteLog;
use App\Models\Lead;
use App\Models\Project;
use App\Models\ProjectCollaborator;
use App\Models\Setting;
use App\Services\AuditService;
use App\Services\CrmAutomationService;
use App\Services\WebhookDispatchService;
use App\Support\ContractTemplate;
use App\Support\EventTypeSettings;
use App\Support\GalleryTemplate;
use App\Support\InstallationPlan;
use App\Support\Tenancy\TenantContext;
use App\Support\TenantThemeSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function __construct(
        private readonly CrmAutomationService $automationService,
        private readonly AuditService $audit,
        private readonly WebhookDispatchService $webhooks,
    ) {}

    public function index()
    {
        $user = request()->user();
        $projects = Project::with('lead', 'contract');

        if ($user?->isPhotographer()) {
            $projects->whereHas('collaborators', fn ($query) => $query
                ->where('user_id', $user->id)
                ->where('status', 'active'));
        }

        return Inertia::render('Admin/Projects/Index', [
            'projects' => $projects->latest()->get()->map(fn (Project $project) => [
                ...$project->toArray(),
                'workspace_entry_url' => $project->userCan($user, 'manage_gallery')
                    ? "/admin/projects/{$project->id}/details"
                    : "/admin/projects/{$project->id}/gallery",
            ])->values(),
            'installationPlan' => InstallationPlan::current(),
            'eventTypes' => EventTypeSettings::get(),
        ]);
    }

    public function show(Project $project)
    {
        return request()->user()?->isPhotographer()
            ? to_route('admin.projects.gallery', $project, 303)
            : to_route('admin.projects.details', $project, 303);
    }

    public function details(Project $project)
    {
        abort_unless($project->userCan(request()->user(), 'manage_gallery'), 403);

        return Inertia::render('Admin/Projects/Details', $this->projectAdminPayload($project, 'details'));
    }

    public function gallery(Project $project)
    {
        return Inertia::render('Admin/Projects/Gallery', $this->projectAdminPayload($project, 'gallery'));
    }

    public function design(Project $project)
    {
        abort_unless($project->userCan(request()->user(), 'manage_gallery'), 403);

        return Inertia::render('Admin/Projects/Design', $this->projectAdminPayload($project, 'design'));
    }

    public function ai(Project $project)
    {
        abort_unless($project->userCan(request()->user(), 'manage_gallery'), 403);

        return Inertia::render('Admin/Projects/Ai', $this->projectAdminPayload($project, 'ai'));
    }

    public function management(Project $project)
    {
        abort_unless($project->userCan(request()->user(), 'finance'), 403);

        return Inertia::render('Admin/Projects/Management', $this->projectAdminPayload($project, 'management'));
    }

    public function storeDirect(Request $request)
    {
        $request->validate([
            'client_name' => 'required|string|max:255',
            'project_name' => 'required|string|max:255',
        ]);

        $tenant = app(TenantContext::class)->tenant();
        $projectLimit = $tenant?->featureLimit('projects_limit');
        if ($projectLimit !== null && Project::count() >= (int) $projectLimit) {
            return redirect()->back()->with('error', $this->projectLimitMessage($tenant, (int) $projectLimit));
        }

        $client = Client::firstOrCreate(
            ['email' => strtolower(str_replace(' ', '', $request->client_name)).'@client.local'],
            ['full_name' => $request->client_name]
        );

        $lead = Lead::create([
            'client_id' => $client->id,
            'name' => $request->client_name,
            'email' => strtolower(str_replace(' ', '', $request->client_name)).'-'.rand(100, 999).'@upload.dummy',
            'event_type' => 'Direct Upload',
            'status' => 'project',
        ]);

        $plan = InstallationPlan::current();

        $project = Project::create([
            'lead_id' => $lead->id,
            'client_id' => $client->id,
            'owner_user_id' => $request->user()?->id,
            'name' => $request->project_name,
            'status' => 'active',
            'gallery_token' => Str::random(40),
            'gallery_password' => strtoupper(Str::random(8)),
            'download_limit' => null,
            'weekly_download_limit' => null,
            'downloads_window_started_at' => now(),
            'retention_days' => $plan['retention_days'] ?? null,
            'storage_limit_bytes' => $this->gigabytesToBytes($plan['storage_limit_gb'] ?? null),
            'originals_expires_at' => isset($plan['retention_days']) ? now()->addDays($plan['retention_days']) : null,
            'gallery_template_code' => $this->initialGalleryTemplateCode($plan),
            'face_recognition_enabled' => $this->shouldEnableFaceRecognitionByDefault(),
            'selected_sponsors' => [],
        ]);

        $project->load('lead', 'client');
        $this->automationService->runImmediate('project_created', $project);
        $tenant = app(TenantContext::class)->tenant();
        if ($tenant) {
            $this->webhooks->fire('project.created', WebhookDispatchService::projectPayload($project), $tenant);
        }

        return redirect()->route('admin.projects.show', $project, 303);
    }

    public function convert(Lead $lead)
    {
        if (Project::where('lead_id', $lead->id)->exists()) {
            return redirect()->back()->with('error', 'Lead already converted.');
        }

        $tenant = app(TenantContext::class)->tenant();
        $projectLimit = $tenant?->featureLimit('projects_limit');
        if ($projectLimit !== null && Project::count() >= (int) $projectLimit) {
            return redirect()->back()->with('error', $this->projectLimitMessage($tenant, (int) $projectLimit));
        }

        $plan = InstallationPlan::current();

        $client = $lead->client ?: Client::firstOrCreate(
            ['email' => $lead->email],
            ['full_name' => $lead->name]
        );

        if (! $lead->client_id) {
            $lead->update(['client_id' => $client->id]);
        }

        $project = Project::create([
            'lead_id' => $lead->id,
            'client_id' => $client->id,
            'owner_user_id' => request()->user()?->id,
            'name' => 'Project: '.$lead->name.' ('.$lead->event_type.')',
            'event_date' => $lead->tentative_date,
            'status' => 'pending_payment',
            'gallery_token' => Str::random(40),
            'gallery_password' => strtoupper(Str::random(8)),
            'download_limit' => null,
            'weekly_download_limit' => null,
            'downloads_window_started_at' => now(),
            'retention_days' => $plan['retention_days'] ?? null,
            'storage_limit_bytes' => $this->gigabytesToBytes($plan['storage_limit_gb'] ?? null),
            'originals_expires_at' => isset($plan['retention_days']) ? now()->addDays($plan['retention_days']) : null,
            'gallery_template_code' => $this->initialGalleryTemplateCode($plan),
            'face_recognition_enabled' => $this->shouldEnableFaceRecognitionByDefault(),
            'selected_sponsors' => [],
        ]);

        $lead->update(['status' => 'project']);

        if ($project->event_date) {
            Event::create([
                'project_id' => $project->id,
                'title' => 'Session: '.$project->name,
                'start' => $project->event_date->startOfDay()->addHours(10),
                'end' => $project->event_date->startOfDay()->addHours(18),
                'type' => 'session',
            ]);
        }

        $this->generateContract($project);
        $project->load('lead', 'client');
        $this->automationService->runImmediate('project_created', $project);
        $tenant = app(TenantContext::class)->tenant();
        if ($tenant) {
            $this->webhooks->fire('project.created', WebhookDispatchService::projectPayload($project), $tenant);
        }

        return redirect()->route('admin.projects.show', $project, 303);
    }

    public function generateContract(Project $project)
    {
        Contract::updateOrCreate(
            ['project_id' => $project->id],
            [
                'content' => ContractTemplate::defaultTemplateForEventType($project->lead?->event_type),
                'status' => 'pending',
                'token' => Str::random(40),
            ]
        );

        return redirect()->back()->with('success', 'Contract generated successfully.');
    }

    public function publicSignatureView($token)
    {
        $contract = Contract::where('token', $token)->with('project.lead')->firstOrFail();
        $payload = [
            'contract' => $contract,
            'renderedContent' => ContractTemplate::render($contract),
            'theme' => TenantThemeSettings::get(app(TenantContext::class)->id()),
        ];
        if ($contract->status === 'signed') {
            return Inertia::render('Public/ContractSigned', $payload);
        }

        return Inertia::render('Public/SignContract', $payload);
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
            'name' => 'nullable|string|max:255',
            'event_date' => 'nullable|date',
            'location' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,pending_payment,editing,delivered',
            'hero_photo_id' => 'nullable|integer|exists:photos,id',
            'hero_focus_x' => 'nullable|string|max:10',
            'hero_focus_y' => 'nullable|string|max:10',
            'gallery_template_code' => 'nullable|string|max:100',
            'website_category' => 'nullable|string|max:255',
            'website_description' => 'nullable|string|max:1500',
            'face_recognition_enabled' => 'nullable|boolean',
            'selected_sponsors' => 'nullable|array',
            'selected_sponsors.*' => 'string|max:80',
        ]);

        $payload = [];

        if (array_key_exists('name', $validated)) {
            $payload['name'] = $validated['name'];
        }

        if (array_key_exists('event_date', $validated)) {
            $payload['event_date'] = $validated['event_date'];
        }

        if (array_key_exists('location', $validated)) {
            $payload['location'] = $validated['location'];
        }

        if (array_key_exists('status', $validated) && $validated['status']) {
            $payload['status'] = $validated['status'];
        }

        if (array_key_exists('hero_photo_id', $validated)) {
            $heroPhoto = $validated['hero_photo_id']
                ? $project->photos()->whereKey($validated['hero_photo_id'])->first()
                : null;

            if ($validated['hero_photo_id'] && ! $heroPhoto) {
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

        if (array_key_exists('website_category', $validated)) {
            $payload['website_category'] = $validated['website_category'];
        }

        if (array_key_exists('website_description', $validated)) {
            $payload['website_description'] = $validated['website_description'];
        }

        if (array_key_exists('face_recognition_enabled', $validated)) {
            $payload['face_recognition_enabled'] = (bool) $validated['face_recognition_enabled'];
        }

        if (array_key_exists('selected_sponsors', $validated)) {
            $selectedSponsors = collect($validated['selected_sponsors'] ?? [])
                ->map(fn ($value) => trim((string) $value))
                ->filter()
                ->unique()
                ->values();

            if (! $project->supportsSponsorDetection()) {
                $selectedSponsors = collect();
            }

            $limit = $project->sponsorSelectionLimit();
            if ($limit !== null && $selectedSponsors->count() > $limit) {
                return back(status: 303)->with('error', "Tu plan solo permite seleccionar hasta {$limit} patrocinadores por evento.");
            }

            if ($project->requiresExplicitSponsors() && $payload['face_recognition_enabled'] ?? $project->face_recognition_enabled) {
                if ($project->supportsSponsorDetection() && $selectedSponsors->isEmpty()) {
                    return back(status: 303)->with('error', 'Selecciona al menos un patrocinador antes de activar o ejecutar la IA en este evento.');
                }
            }

            $payload['selected_sponsors'] = $selectedSponsors->all();
        }

        if (! empty($payload)) {
            $project->update($payload);
        }

        return back(status: 303)->with('success', 'Proyecto actualizado.');
    }

    private function gigabytesToBytes(?float $gigabytes): ?int
    {
        if ($gigabytes === null) {
            return null;
        }

        return (int) round($gigabytes * 1024 * 1024 * 1024);
    }

    private function projectLimitMessage($tenant, int $projectLimit): string
    {
        $planName = $tenant?->planDefinition()['name'] ?? 'actual';

        return "Has alcanzado el limite de proyectos de tu plan {$planName} (Limite: {$projectLimit}).";
    }

    private function serializePhotoForAdmin($photo): array
    {
        $resolvedUrl = $photo->optimized_path
            ? $this->temporaryUrlOrFallback($photo->optimized_path)
            : null;
        $thumbnailUrl = $photo->thumbnail_url
            ? $this->temporaryUrlOrFallback($photo->thumbnail_url)
            : $resolvedUrl;

        $faceDetections = $photo->relationLoaded('unknownDetections')
            ? $photo->unknownDetections->map(fn ($d) => [
                'id' => $d->id,
                'face_index' => $d->face_index,
                'bbox' => $d->bbox,
            ])->values()->all()
            : [];

        return [
            ...$photo->makeHidden('unknownDetections')->toArray(),
            'url' => $resolvedUrl,
            'thumbnail_url' => $thumbnailUrl,
            'people_count_label' => $photo->people_count_label,
            'face_detections' => $faceDetections,
            'recognition_status_label' => match ($photo->recognition_status) {
                'matched' => 'Coincidencia detectada',
                'no_match' => 'Sin coincidencias',
                'no_face' => 'Sin rostro',
                'error' => 'Error de analisis',
                'manual' => 'Etiquetado manual',
                default => 'Sin analizar',
            },
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

    private function projectAdminPayload(Project $project, string $page = 'full'): array
    {
        if (! $project->gallery_token) {
            $project->update(['gallery_token' => Str::random(40)]);
        }

        if (! $project->gallery_password) {
            $project->update(['gallery_password' => strtoupper(Str::random(8))]);
        }

        $needsPhotos     = in_array($page, ['gallery', 'ai', 'full']);
        $needsFinance    = in_array($page, ['management', 'full']);
        $needsAnalytics  = in_array($page, ['management', 'full']);
        $needsFaceAi     = in_array($page, ['ai', 'full']);
        $needsCollabs    = in_array($page, ['details', 'full']);
        $needsDesign     = in_array($page, ['design', 'full']);

        // Build eager-load list based on page needs
        $relations = ['lead'];
        if ($needsFinance) {
            $relations[] = 'contract';
            $relations[] = 'invoices';
        }
        if ($needsPhotos || $needsDesign) {
            $relations['heroPhoto'] = fn ($q) => $q;
        }
        if ($needsPhotos) {
            $relations['photos'] = function ($q) use ($needsFaceAi) {
                if ($needsFaceAi) {
                    $q->with(['unknownDetections' => function ($q) {
                        $q->where('status', 'unknown')->select(['id', 'photo_id', 'face_index', 'bbox', 'best_confidence']);
                    }]);
                }
            };
        }

        $project->load($relations);

        $serializedPhotos = $needsPhotos
            ? $project->photos->map(fn ($photo) => $this->serializePhotoForAdmin($photo))->values()
            : collect();

        $supportsSponsorDetection = $project->supportsSponsorDetection();
        $sponsorCatalog   = ($needsFaceAi && $supportsSponsorDetection) ? $this->sponsorCatalogForProject() : [];
        $selectedSponsors = ($needsFaceAi && $supportsSponsorDetection) ? $project->selectedSponsors() : [];

        // faceRecognition section — full only for 'ai', minimal for other pages
        if ($needsFaceAi) {
            $faceRecognition = [
                'enabled' => $project->face_recognition_enabled,
                'sports_mode_enabled' => filter_var(Setting::get('ai_sports_mode_enabled', '0'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false,
                'gemini_enabled' => filled(config('services.gemini.api_key')),
                'tenant_scope_enabled' => Setting::get('face_detection_scope', 'project_only') === 'all_galleries',
                'service_configured' => filled(config('services.face_ai.identity_task_queue')) && filled(config('services.face_ai.recognize_task_queue')) && filled(config('services.face_ai.result_queue')),
                'database_ready' => FaceIdentity::withoutGlobalScope('tenant')
                    ->where('tenant_id', $project->tenant_id)
                    ->whereNotNull('embedding')
                    ->where(function ($query) use ($project) {
                        $query->whereNull('project_id')
                            ->orWhere('project_id', $project->id);
                    })
                    ->exists(),
                'global_identities_count' => FaceIdentity::withoutGlobalScope('tenant')
                    ->where('tenant_id', $project->tenant_id)
                    ->whereNull('project_id')
                    ->count(),
                'sponsor_catalog' => $sponsorCatalog,
                'selected_sponsors' => $selectedSponsors,
                'summary' => [
                    'photos_with_people' => $project->photos->filter(fn ($photo) => ! empty($photo->people_tags))->count(),
                    'photos_with_brands' => $project->photos->filter(fn ($photo) => ! empty($photo->brand_tags))->count(),
                    'photos_with_jerseys' => $project->photos->filter(fn ($photo) => ! empty($photo->jersey_numbers))->count(),
                    'photos_with_sponsors' => $project->photos->filter(fn ($photo) => ! empty($photo->sponsor_tags))->count(),
                    'photos_with_context' => $project->photos->filter(fn ($photo) => ! empty($photo->context_tags))->count(),
                    'photos_with_actions' => $project->photos->filter(fn ($photo) => ! empty($photo->action_tags))->count(),
                    'photos_processed' => $project->photos->filter(fn ($photo) => filled($photo->recognition_status) && $photo->recognition_status !== 'pending')->count(),
                    'photos_pending' => $project->photos->filter(fn ($photo) => blank($photo->recognition_status) || $photo->recognition_status === 'pending')->count(),
                    'photos_never_queued' => $project->photos->filter(fn ($photo) => blank($photo->recognition_status))->count(),
                    'photos_queued_or_stuck' => $project->photos->where('recognition_status', 'pending')->count(),
                    'people_detected_total' => $project->photos->sum(fn ($photo) => count($photo->people_tags ?? [])),
                    'brands_detected_total' => $project->photos->sum(fn ($photo) => count($photo->brand_tags ?? [])),
                    'jerseys_detected_total' => $project->photos->sum(fn ($photo) => count($photo->jersey_numbers ?? [])),
                    'sponsors_detected_total' => $project->photos->sum(fn ($photo) => count($photo->sponsor_tags ?? [])),
                    'context_detected_total' => $project->photos->sum(fn ($photo) => count($photo->context_tags ?? [])),
                    'actions_detected_total' => $project->photos->sum(fn ($photo) => count($photo->action_tags ?? [])),
                    'photos_without_face' => $project->photos->where('recognition_status', 'no_face')->count(),
                    'photos_without_match' => $project->photos->where('recognition_status', 'no_match')->count(),
                    'photos_with_errors' => $project->photos->where('recognition_status', 'error')->count(),
                ],
                'identities' => FaceIdentity::withoutGlobalScope('tenant')
                    ->where('tenant_id', $project->tenant_id)
                    ->where(function ($q) use ($project) {
                        $q->whereNull('project_id')->orWhere('project_id', $project->id);
                    })
                    ->withCount('vectors')
                    ->latest()
                    ->get()
                    ->map(fn (FaceIdentity $identity) => [
                        'id' => $identity->id,
                        'name' => $identity->name,
                        'scope' => $identity->project_id ? 'project' : 'global',
                        'processing_status' => $identity->processing_status,
                        'vectors_count' => (int) ($identity->vectors_count ?? 0),
                    ])
                    ->values()
                    ->all(),
            ];
        } else {
            // Minimal stub — pages that don't use faceRecognition still receive the shape
            $faceRecognition = [
                'enabled' => $project->face_recognition_enabled,
                'sports_mode_enabled' => false,
                'gemini_enabled' => false,
                'tenant_scope_enabled' => false,
                'service_configured' => false,
                'database_ready' => false,
                'global_identities_count' => 0,
                'sponsor_catalog' => [],
                'selected_sponsors' => [],
                'summary' => [],
                'identities' => [],
            ];
        }

        $heroPhoto = ($project->relationLoaded('heroPhoto') && $project->heroPhoto)
            ? $this->serializePhotoForAdmin($project->heroPhoto)
            : null;

        return [
            'project' => [
                ...$project->toArray(),
                'photos' => $serializedPhotos,
                'heroPhoto' => $heroPhoto,
                'originals_usage_bytes' => $needsFinance ? $project->originalsUsageBytes() : null,
                'high_res_available' => $needsFinance ? $project->highResAvailable() : false,
                'remaining_weekly_downloads' => $needsFinance ? $project->remainingWeeklyDownloads() : null,
                'public_gallery_url' => URL::route('public.gallery.show', $project->gallery_token),
                'selected_sponsors' => $selectedSponsors,
                'sponsor_catalog' => $sponsorCatalog,
                'plan_capabilities' => [
                    'plan_name' => $project->planName(),
                    'supports_face_recognition' => (bool) $project->tenant?->supportsFaceRecognition(),
                    'supports_sponsor_detection' => $supportsSponsorDetection,
                    'sponsor_selection_limit' => $project->sponsorSelectionLimit(),
                    'requires_explicit_sponsors' => $project->requiresExplicitSponsors(),
                    'photos_per_month_limit' => $project->tenant?->photosPerMonthLimit(),
                    'ai_scans_monthly_limit' => $project->tenant?->aiScansMonthlyLimit(),
                    'remaining_photo_quota' => $project->tenant?->remainingPhotoProcessingQuota(),
                ],
                'permissions' => [
                    'can_upload' => $project->userCan(request()->user(), 'upload'),
                    'can_manage_gallery' => $project->userCan(request()->user(), 'manage_gallery'),
                    'can_manage_finance' => $project->userCan(request()->user(), 'finance'),
                ],
                'collaborators' => $needsCollabs
                    ? $project->collaborators()
                        ->with('user:id,name,email,role')
                        ->latest()
                        ->get()
                        ->map(fn (ProjectCollaborator $collaborator) => [
                            'id' => $collaborator->id,
                            'name' => $collaborator->user?->name,
                            'email' => $collaborator->user?->email ?: $collaborator->invited_email,
                            'role' => $collaborator->role,
                            'status' => $collaborator->status,
                            'can_upload' => $collaborator->can_upload,
                            'can_manage_gallery' => $collaborator->can_manage_gallery,
                            'access_code' => $collaborator->access_code,
                            'access_url' => $collaborator->plainAccessToken()
                                ? route('project.invitations.show', $collaborator->plainAccessToken())
                                : null,
                        ])
                        ->values()
                        ->all()
                    : [],
            ],
            'faceRecognition' => $faceRecognition,
            'analytics' => $needsAnalytics ? $this->projectAnalytics($project) : [],
            'installationPlan' => InstallationPlan::current(),
            'availableTemplates' => $needsDesign ? $this->availableTemplatesForCurrentPlan() : [],
            'billingSettings' => $needsFinance ? [
                'itbms_enabled' => filter_var(Setting::get('tax_itbms_enabled', '1'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true,
                'itbms_rate' => (float) Setting::get('tax_itbms_rate', '7'),
                'alanube_enabled' => filter_var(Setting::get('alanube_enabled', '0'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false,
            ] : ['itbms_enabled' => false, 'itbms_rate' => 0.0, 'alanube_enabled' => false],
        ];
    }

    private function sponsorCatalogForProject(): array
    {
        $decoded = json_decode((string) Setting::get('ai_sponsor_catalog', '[]'), true);

        if (! is_array($decoded)) {
            return [];
        }

        return collect($decoded)
            ->filter(fn ($item) => is_array($item) && filled($item['name'] ?? null))
            ->map(fn (array $item) => trim((string) $item['name']))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function initialGalleryTemplateCode(array $plan): string
    {
        $preferred = GalleryTemplate::defaultCode(app(TenantContext::class)->id());

        return GalleryTemplate::isAllowedForPlan($preferred, $plan)
            ? $preferred
            : GalleryTemplate::firstAllowedCode($plan);
    }

    private function shouldEnableFaceRecognitionByDefault(): bool
    {
        return Setting::get('face_detection_scope', 'project_only') === 'all_galleries';
    }

    private function projectAnalytics(Project $project): array
    {
        $galleryDownloadCount = DownloadLog::query()
            ->where('project_id', $project->id)
            ->where('asset_type', 'gallery')
            ->count();

        $photoDownloadCount = DownloadLog::query()
            ->where('project_id', $project->id)
            ->where('asset_type', 'photo')
            ->count();

        $videoDownloadCount = DownloadLog::query()
            ->where('project_id', $project->id)
            ->where('asset_type', 'video')
            ->count();

        $downloadGallery = DownloadLog::query()
            ->where('project_id', $project->id)
            ->where('asset_type', 'gallery')
            ->latest()
            ->take(15)
            ->get()
            ->map(fn (DownloadLog $log) => $this->serializeDownloadLog($log))
            ->values()
            ->all();

        $downloadPhoto = DownloadLog::query()
            ->with('photo')
            ->where('project_id', $project->id)
            ->where('asset_type', 'photo')
            ->latest()
            ->take(20)
            ->get()
            ->map(fn (DownloadLog $log) => $this->serializeDownloadLog($log))
            ->values()
            ->all();

        $downloadVideo = DownloadLog::query()
            ->where('project_id', $project->id)
            ->where('asset_type', 'video')
            ->latest()
            ->take(15)
            ->get()
            ->map(fn (DownloadLog $log) => $this->serializeDownloadLog($log))
            ->values()
            ->all();

        $favoriteActivity = GalleryFavoriteLog::query()
            ->with('photo')
            ->where('project_id', $project->id)
            ->latest()
            ->take(20)
            ->get()
            ->map(fn (GalleryFavoriteLog $log) => [
                'id' => $log->id,
                'visitor_email' => $log->visitor_email,
                'action' => $log->action,
                'created_at' => optional($log->created_at)?->toIso8601String(),
                'photo_id' => $log->photo_id,
                'photo_label' => $log->photo ? 'Foto #'.$log->photo->id : null,
            ])
            ->values()
            ->all();

        $emailRegistrations = GalleryEmailRegistration::query()
            ->where('project_id', $project->id)
            ->latest()
            ->take(20)
            ->get()
            ->map(fn (GalleryEmailRegistration $registration) => [
                'id' => $registration->id,
                'visitor_name' => $registration->visitor_name,
                'visitor_email' => $registration->visitor_email,
                'created_at' => optional($registration->created_at)?->toIso8601String(),
            ])
            ->values()
            ->all();

        $registrationsByHash = GalleryEmailRegistration::query()
            ->where('project_id', $project->id)
            ->get()
            ->keyBy('client_hash');

        $clientSelections = GalleryFavorite::query()
            ->with('photo')
            ->where('project_id', $project->id)
            ->get()
            ->groupBy('client_hash')
            ->map(function ($favorites, $clientHash) use ($registrationsByHash) {
                $registration = $registrationsByHash->get($clientHash);
                $photos = $favorites->map(function ($fav) {
                    $photo = $fav->photo;
                    if (! $photo) {
                        return null;
                    }
                    $thumbPath = $photo->thumbnail_url ?: $photo->optimized_path;
                    return [
                        'id' => $photo->id,
                        'thumbnail_url' => $thumbPath ? $this->temporaryUrlOrFallback($thumbPath) : null,
                        'filename' => $this->cleanPhotoFilename($photo->original_path ?: $photo->url ?: ('foto-'.$photo->id)),
                    ];
                })->filter()->values()->all();

                return [
                    'client_hash' => $clientHash,
                    'visitor_name' => $registration?->visitor_name,
                    'visitor_email' => $registration?->visitor_email ?? $favorites->first()->visitor_email,
                    'photo_count' => count($photos),
                    'photos' => $photos,
                    'updated_at' => optional($favorites->sortByDesc('updated_at')->first()->updated_at)?->toIso8601String(),
                ];
            })
            ->sortByDesc('updated_at')
            ->values()
            ->all();

        return [
            'downloads' => [
                'gallery' => $downloadGallery,
                'photo' => $downloadPhoto,
                'video' => $downloadVideo,
                'summary' => [
                    'gallery_count' => $galleryDownloadCount,
                    'photo_count' => $photoDownloadCount,
                    'video_count' => $videoDownloadCount,
                ],
            ],
            'favorites' => [
                'activity' => $favoriteActivity,
                'lists_count' => GalleryEmailRegistration::query()
                    ->where('project_id', $project->id)
                    ->whereIn('visitor_email', GalleryFavoriteLog::query()->where('project_id', $project->id)->whereNotNull('visitor_email')->select('visitor_email'))
                    ->distinct('visitor_email')
                    ->count('visitor_email'),
            ],
            'registrations' => [
                'activity' => $emailRegistrations,
                'count' => GalleryEmailRegistration::query()->where('project_id', $project->id)->count(),
            ],
            'client_selections' => $clientSelections,
        ];
    }

    public function destroy(Request $request, Project $project)
    {
        abort_unless($project->userCan($request->user(), 'manage_gallery'), 403);

        $request->validate([
            'confirmation' => ['required', 'string', 'in:' . $project->name],
        ], [
            'confirmation.in' => 'El nombre de la colección no coincide.',
        ]);

        // Gather R2 paths before deleting DB records
        $photoData = $project->photos()
            ->select(['optimized_path', 'original_path', 'thumbnail_url', 'gemini_path'])
            ->get()
            ->map(fn ($p) => $p->only(['optimized_path', 'original_path', 'thumbnail_url', 'gemini_path']))
            ->all();

        $identityPaths = $project->faceIdentities()
            ->pluck('path_reference')
            ->filter()
            ->values()
            ->all();

        $tenantId    = $project->tenant_id;
        $projectName = $project->name;
        $projectId   = $project->id;
        $photosCount = count($photoData);

        // Delete all DB records (cascade via DB or explicit)
        $project->photos()->each(fn ($photo) => $photo->unknownDetections()->delete());
        $project->photos()->delete();
        $project->faceIdentities()->each(function ($identity) {
            $identity->vectors()->delete();
            $identity->delete();
        });
        $project->collaborators()->delete();
        $project->galleryEmailRegistrations()->delete();
        $project->galleryFavorites()->delete();
        $project->galleryFavoriteLogs()->delete();
        $project->downloadLogs()->delete();
        $project->delete();

        $this->audit->log('project.deleted', [
            'project_id'   => $projectId,
            'project_name' => $projectName,
            'photos_count' => $photosCount,
        ]);

        // Dispatch background job to clean R2
        if (!empty($photoData) || !empty($identityPaths)) {
            DeleteProjectJob::dispatch($project->id, $tenantId, $photoData, $identityPaths);
        }

        return to_route('admin.projects', status: 303)
            ->with('success', "Colección \"{$project->name}\" eliminada correctamente.");
    }

    private function serializeDownloadLog(DownloadLog $log): array
    {
        return [
            'id' => $log->id,
            'asset_type' => $log->asset_type,
            'visitor_email' => $log->visitor_email,
            'created_at' => optional($log->created_at)?->toIso8601String(),
            'photo_id' => $log->photo_id,
            'photo_label' => $log->photo_id ? 'Foto #'.$log->photo_id : null,
        ];
    }

    private function cleanPhotoFilename(string $path): string
    {
        $basename = basename($path);
        // Strip the uniqid() suffix added during upload: name_13hexchars.ext → name.ext
        return preg_replace('/_[0-9a-f]{13}(\.[^.]+)$/i', '$1', $basename) ?? $basename;
    }
}
