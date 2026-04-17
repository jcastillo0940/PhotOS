<?php

namespace App\Http\Controllers;

use App\Models\FaceIdentity;
use App\Models\Project;
use App\Models\Setting;
use App\Services\FaceRecognitionService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class FaceDetectionController extends Controller
{
    private const CATALOG_TYPES = [
        'brand' => [
            'label' => 'Marcas',
            'setting_key' => 'ai_brand_catalog',
            'storage_dir' => 'face-detection/catalog/brands',
            'success_store' => 'Marca agregada a la biblioteca IA.',
            'success_delete' => 'Marca eliminada de la biblioteca IA.',
        ],
        'sponsor' => [
            'label' => 'Sponsors',
            'setting_key' => 'ai_sponsor_catalog',
            'storage_dir' => 'face-detection/catalog/sponsors',
            'success_store' => 'Sponsor agregado a la biblioteca IA.',
            'success_delete' => 'Sponsor eliminado de la biblioteca IA.',
        ],
        'jersey' => [
            'label' => 'Dorsales',
            'setting_key' => 'ai_jersey_catalog',
            'storage_dir' => 'face-detection/catalog/jerseys',
            'success_store' => 'Dorsal agregado a la biblioteca IA.',
            'success_delete' => 'Dorsal eliminado de la biblioteca IA.',
        ],
        'context' => [
            'label' => 'Contexto',
            'setting_key' => 'ai_context_catalog',
            'storage_dir' => 'face-detection/catalog/context',
            'success_store' => 'Contexto agregado a la biblioteca IA.',
            'success_delete' => 'Contexto eliminado de la biblioteca IA.',
        ],
    ];

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
            'detected_brands_count' => (int) $project->photos()->whereNotNull('brand_tags')->get()->sum(fn ($photo) => count($photo->brand_tags ?? [])),
            'local_identities_count' => FaceIdentity::withoutGlobalScope('tenant')->where('tenant_id', $tenantId)->where('project_id', $project->id)->count(),
            'database_ready' => $this->faceRecognitionService->hasRecognitionDatabase($project),
            'workspace_url' => "/admin/projects/{$project->id}/ai",
        ])->values();

        $photos = $projects->flatMap->photos;
        $catalogs = collect(self::CATALOG_TYPES)->mapWithKeys(fn (array $config, string $type) => [
            $type => [
                'label' => $config['label'],
                'items' => $this->catalogItems($type)->all(),
            ],
        ]);

        return Inertia::render('Admin/FaceDetection/Index', [
            'mode' => Setting::get('face_detection_scope', 'project_only'),
            'sportsModeEnabled' => filter_var(Setting::get('ai_sports_mode_enabled', '0'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false,
            'serviceConfigured' => $this->faceRecognitionService->enabled(),
            'projects' => $projectSummaries,
            'identities' => $identities,
            'catalogs' => $catalogs,
            'stats' => [
                'projects_count' => $projects->count(),
                'photos_count' => $photos->count(),
                'global_identities_count' => $identities->where('scope', 'global')->count(),
                'local_identities_count' => $identities->where('scope', 'project')->count(),
                'photos_with_people' => $photos->filter(fn ($photo) => ! empty($photo->people_tags))->count(),
                'catalog_brands_count' => count($catalogs['brand']['items'] ?? []),
                'catalog_sponsors_count' => count($catalogs['sponsor']['items'] ?? []),
                'catalog_jerseys_count' => count($catalogs['jersey']['items'] ?? []),
                'catalog_context_count' => count($catalogs['context']['items'] ?? []),
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
        // Use relative paths — the R2 disk root already includes the tenant prefix (tenants/{slug})
        $directory = $project
            ? 'projects/'.$project->id.'/face-identities'
            : 'face-identities/global';

        $file = $request->file('reference_image');
        $storedPath = $file->storeAs(
            $directory,
            uniqid('identity_', true).'.'.strtolower($file->getClientOriginalExtension() ?: 'jpg'),
            $this->libraryStorageDisk()
        );

        $identity = FaceIdentity::create([
            'tenant_id' => $tenantId,
            'project_id' => $project?->id,
            'name' => trim((string) $validated['name']),
            'embedding' => null,
            'path_reference' => $this->storeReference($this->libraryStorageDisk(), $storedPath),
            'processing_status' => 'pending',
            'processing_note' => $project
                ? 'Rostro enviado para procesar en esta galeria.'
                : 'Rostro global enviado para procesar en todo el tenant.',
        ]);

        $this->faceRecognitionService->dispatchTenantIdentityExtraction($identity);

        return back(status: 303)->with('success', 'Rostro registrado. El motor IA lo procesara en segundo plano.');
    }

    public function storeCatalogItem(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:brand,sponsor,jersey,context',
            'name' => 'required|string|max:80',
            'reference_image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:10000',
        ]);

        $type = (string) $validated['type'];
        $config = $this->catalogConfig($type);
        $items = $this->catalogItems($type);
        $normalizedName = $this->normalizeCatalogName($type, $validated['name']);

        if ($items->contains(fn (array $item) => strcasecmp((string) ($item['name'] ?? ''), $normalizedName) === 0)) {
            return back(status: 303)->with('error', $config['label'].' ya existe en esta biblioteca.');
        }

        $referencePath = null;

        if ($request->hasFile('reference_image')) {
            $file = $request->file('reference_image');
            $referencePath = $file->storeAs(
                $config['storage_dir'],
                uniqid($type.'_', true).'.'.strtolower($file->getClientOriginalExtension() ?: 'jpg'),
                $this->libraryStorageDisk()
            );
            $referencePath = $this->storeReference($this->libraryStorageDisk(), $referencePath);
        }

        $items->prepend([
            'id' => (string) Str::uuid(),
            'name' => $normalizedName,
            'reference_path' => $referencePath,
            'created_at' => now()->toIso8601String(),
        ]);

        Setting::set($config['setting_key'], $items->values()->toJson(JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), 'ai');

        return back(status: 303)->with('success', $config['success_store']);
    }

    public function destroyIdentity(FaceIdentity $faceIdentity)
    {
        abort_unless((int) $faceIdentity->tenant_id === (int) $this->tenantContext->id(), 404);

        if ($faceIdentity->path_reference) {
            [$disk, $path] = $this->resolveStoredReference($faceIdentity->path_reference);
            Storage::disk($disk)->delete($path);
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

    public function destroyCatalogItem(string $type, string $itemId)
    {
        $config = $this->catalogConfig($type);
        $items = $this->catalogItems($type);
        $item = $items->first(fn (array $entry) => (string) ($entry['id'] ?? '') === $itemId);

        if (! $item) {
            abort(404);
        }

        if (! empty($item['reference_path'])) {
            [$disk, $path] = $this->resolveStoredReference((string) $item['reference_path']);
            Storage::disk($disk)->delete($path);
        }

        $remaining = $items
            ->reject(fn (array $entry) => (string) ($entry['id'] ?? '') === $itemId)
            ->values();

        Setting::set($config['setting_key'], $remaining->toJson(JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), 'ai');

        return back(status: 303)->with('success', $config['success_delete']);
    }

    public function runAll()
    {
        $mode = Setting::get('face_detection_scope', 'project_only');
        $projects = Project::query()->with('photos')->get();
        $queuedProjects = 0;
        $queuedPhotos = 0;

        foreach ($projects as $project) {
            if ($mode === 'all_galleries' && ! $project->face_recognition_enabled) {
                $project->update(['face_recognition_enabled' => true]);
            }

            if (! $project->face_recognition_enabled && $mode !== 'all_galleries') {
                continue;
            }

            if ($project->photos->isEmpty() || ! $this->faceRecognitionService->hasRecognitionDatabase($project)) {
                continue;
            }

            $queuedProjects++;
            $queuedPhotos += $this->faceRecognitionService->dispatchProjectRecognition($project);
        }

        return back(status: 303)->with('success', "Se enviaron {$queuedPhotos} fotos de {$queuedProjects} galerias a la cola IA.");
    }

    private function previewUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        [$disk, $storedPath] = $this->resolveStoredReference($path);

        try {
            if ($disk === 'public') {
                return Storage::disk('public')->url($storedPath);
            }

            return Storage::disk($disk)->temporaryUrl($storedPath, now()->addMinutes(30));
        } catch (\Throwable $e) {
            return filter_var($storedPath, FILTER_VALIDATE_URL) ? $storedPath : null;
        }
    }

    private function libraryStorageDisk(): string
    {
        return filled(config('filesystems.disks.r2.bucket')) ? 'r2' : 'public';
    }

    private function storeReference(string $disk, string $path): string
    {
        return $disk === 'r2' ? $path : $disk.':'.$path;
    }

    private function resolveStoredReference(string $reference): array
    {
        foreach (['public', 'local', 'r2'] as $disk) {
            $prefix = $disk.':';
            if (str_starts_with($reference, $prefix)) {
                return [$disk, substr($reference, strlen($prefix))];
            }
        }

        return ['r2', $reference];
    }

    private function catalogItems(string $type): Collection
    {
        $config = $this->catalogConfig($type);
        $decoded = json_decode((string) Setting::get($config['setting_key'], '[]'), true);

        if (! is_array($decoded)) {
            $decoded = [];
        }

        return collect($decoded)
            ->filter(fn ($item) => is_array($item) && filled($item['name'] ?? null))
            ->map(fn (array $item) => [
                'id' => (string) ($item['id'] ?? Str::uuid()),
                'name' => (string) $item['name'],
                'reference_path' => $item['reference_path'] ?? null,
                'preview_url' => $this->previewUrl($item['reference_path'] ?? null),
                'created_at' => $item['created_at'] ?? null,
            ])
            ->values();
    }

    private function catalogConfig(string $type): array
    {
        if (! array_key_exists($type, self::CATALOG_TYPES)) {
            abort(404);
        }

        return self::CATALOG_TYPES[$type];
    }

    private function normalizeCatalogName(string $type, string $name): string
    {
        $cleaned = trim(preg_replace('/\s+/', ' ', $name) ?? '');

        if ($type === 'jersey') {
            $digits = preg_replace('/\D+/', '', $cleaned) ?? '';

            return $digits !== '' ? (string) ((int) $digits) : $cleaned;
        }

        return Str::title(Str::lower($cleaned));
    }
}
