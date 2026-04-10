<?php

namespace App\Http\Controllers;

use App\Models\DownloadLog;
use App\Models\FaceIdentity;
use App\Models\GalleryEmailRegistration;
use App\Models\GalleryFavorite;
use App\Models\GalleryFavoriteLog;
use App\Models\Photo;
use App\Models\Project;
use App\Models\Setting;
use App\Support\Tenancy\TenantContext;
use App\Services\FaceRecognitionService;
use App\Support\GalleryTemplate;
use App\Services\CrmAutomationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GalleryController extends Controller
{
    public function __construct(
        private readonly CrmAutomationService $automationService,
        private readonly FaceRecognitionService $faceRecognitionService,
        private readonly TenantContext $tenantContext,
    ) {}

    public function show(Request $request, $token)
    {
        $project = Project::where('gallery_token', $token)->firstOrFail();

        if ($project->photos()->count() === 0) {
            $this->seedMockPhotos($project);
        }

        $project->syncDownloadWindow();
        $project->refresh();
        $ownerViewing = $this->isOwnerViewing($request, $project);
        $registeredVisitor = $this->registeredVisitor($request, $project);
        $hasClientAccess = $this->hasClientGalleryAccess($request, $project);
        $visiblePhotos = $this->paginatePhotos($request, $project, $hasClientAccess);
        $allPhotos = $project->photos()->get();
        $selectedPhotoIds = $registeredVisitor
            ? GalleryFavorite::query()
                ->where('project_id', $project->id)
                ->where('client_hash', $registeredVisitor['client_hash'])
                ->pluck('photo_id')
                ->all()
            : [];

        return Inertia::render('Public/Gallery', [
            'project' => [
                ...collect($project->toArray())->except(['gallery_password'])->all(),
                'originals_expired' => $project->originalsExpired(),
                'high_res_available' => $hasClientAccess && $project->highResAvailable(),
            ],
            'photos' => $visiblePhotos->getCollection()->map(fn (Photo $photo) => $this->serializePhoto($photo, $hasClientAccess, $selectedPhotoIds))->values(),
            'galleryTemplate' => $project->resolvedGalleryTemplate(),
            'access' => [
                'mode' => $hasClientAccess ? 'client' : 'public',
                'can_unlock' => !$hasClientAccess,
                'has_password' => filled($project->gallery_password),
                'can_download_originals' => $hasClientAccess && $project->highResAvailable(),
                'can_select_favorites' => $hasClientAccess && !$ownerViewing && (bool) $registeredVisitor,
                'public_photo_count' => $allPhotos->where('show_on_website', true)->count(),
                'client_photo_count' => $allPhotos->count(),
                'is_owner_session' => $ownerViewing,
                'registered_email' => $registeredVisitor['visitor_email'] ?? null,
                'registered_name' => $registeredVisitor['visitor_name'] ?? null,
            ],
            'pagination' => [
                'current_page' => $visiblePhotos->currentPage(),
                'last_page' => $visiblePhotos->lastPage(),
                'per_page' => $visiblePhotos->perPage(),
                'total' => $visiblePhotos->total(),
                'has_more_pages' => $visiblePhotos->hasMorePages(),
            ],
            'galleryTitle' => 'Selected work: A gallery shaped by emotion, landscape, and movement',
        ]);
    }

    public function registerEmail(Request $request, $token)
    {
        $project = Project::where('gallery_token', $token)->firstOrFail();

        if ($this->isOwnerViewing($request, $project)) {
            return redirect()->route('public.gallery.show', $token, 303);
        }

        $validated = $request->validate([
            'visitor_name' => 'nullable|string|max:255',
            'visitor_email' => 'required|email|max:255',
        ]);

        $email = strtolower(trim((string) $validated['visitor_email']));
        $visitor = [
            'visitor_name' => trim((string) ($validated['visitor_name'] ?? '')),
            'visitor_email' => $email,
            'client_hash' => $this->clientHashFromEmail($project, $email),
        ];

        GalleryEmailRegistration::updateOrCreate(
            [
                'project_id' => $project->id,
                'visitor_email' => $email,
            ],
            [
                'visitor_name' => $visitor['visitor_name'] ?: null,
                'client_hash' => $visitor['client_hash'],
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 65535, ''),
            ]
        );

        $request->session()->put($this->registrationSessionKey($project), $visitor);

        return redirect()->route('public.gallery.show', $token, 303)->with('success', 'Correo registrado. Ya puedes acceder a la coleccion.');
    }

    public function unlock(Request $request, $token)
    {
        $project = Project::where('gallery_token', $token)->firstOrFail();

        $validated = $request->validate([
            'visitor_name' => 'nullable|string|max:255',
            'visitor_email' => 'required|email|max:255',
            'gallery_access_code' => 'required|string|max:255',
        ]);

        if (blank($project->gallery_password)) {
            return back(status: 303)->withErrors([
                'gallery_access_code' => 'Esta galeria aun no tiene un codigo de acceso configurado.',
            ]);
        }

        if (!hash_equals((string) $project->gallery_password, trim((string) $validated['gallery_access_code']))) {
            return back(status: 303)->withErrors([
                'gallery_access_code' => 'El codigo de acceso no es correcto.',
            ]);
        }

        $email = strtolower(trim((string) $validated['visitor_email']));
        $visitor = [
            'visitor_name' => trim((string) ($validated['visitor_name'] ?? '')),
            'visitor_email' => $email,
            'client_hash' => $this->clientHashFromEmail($project, $email),
        ];

        GalleryEmailRegistration::updateOrCreate(
            [
                'project_id' => $project->id,
                'visitor_email' => $email,
            ],
            [
                'visitor_name' => $visitor['visitor_name'] ?: null,
                'client_hash' => $visitor['client_hash'],
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 65535, ''),
            ]
        );

        $request->session()->put($this->registrationSessionKey($project), $visitor);
        $request->session()->put($this->gallerySessionKey($project), true);

        return redirect()->route('public.gallery.show', $token, 303)->with('success', 'Galeria completa desbloqueada.');
    }

    public function upload(Request $request, Project $project)
    {
        set_time_limit(0);

        if (!$this->hasConfiguredR2()) {
            return back(status: 303)->with('error', 'Cloudflare R2 no esta configurado. Completa bucket, endpoint y credenciales antes de subir archivos pesados.');
        }

        $request->validate([
            'photos' => 'required|array',
            'photos.*' => 'image|mimes:jpeg,png,jpg,webp|max:100000',
        ]);

        $tenant = $this->tenantContext->tenant();
        $incomingFiles = count($request->file('photos', []));

        if ($tenant && !$tenant->canUseFeature('photo_uploads', $incomingFiles)) {
            return back(status: 303)->with('error', 'Tu plan actual no permite subir esa cantidad de fotos este mes.');
        }

        $incomingOriginalBytes = collect($request->file('photos'))->sum(fn ($file) => $file->getSize() ?: 0);
        $currentOriginalBytes = $project->originalsUsageBytes();
        $maxOriginalsBytes = (int) ($project->planDefinition()['max_originals_bytes'] ?? $project->storage_limit_bytes ?? 0);

        if ($maxOriginalsBytes > 0 && ($currentOriginalBytes + $incomingOriginalBytes) > $maxOriginalsBytes) {
            return back(status: 303)->with('error', 'Espacio insuficiente para este evento.');
        }

        $orderIndex = $project->photos()->max('order_index') ?? 0;
        $tempMasterDirectory = "uploads/project_{$project->id}/temp_masters";

        foreach ($request->file('photos') as $file) {
            $safeBaseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
            $uniqueSuffix = uniqid();
            $originalFileName = "{$safeBaseName}_{$uniqueSuffix}.{$extension}";
            $optimizedFileName = "{$safeBaseName}_{$uniqueSuffix}.webp";

            $localOriginalRelativePath = $file->storeAs($tempMasterDirectory, $originalFileName, 'local');
            $absoluteOriginalPath = Storage::disk('local')->path($localOriginalRelativePath);

            $optimizedLocalRelativePath = "{$tempMasterDirectory}/optimized/{$optimizedFileName}";
            $absoluteOptimizedPath = Storage::disk('local')->path($optimizedLocalRelativePath);

            if (!file_exists(dirname($absoluteOptimizedPath))) {
                mkdir(dirname($absoluteOptimizedPath), 0755, true);
            }

            $this->createOptimizedWebp($absoluteOriginalPath, $absoluteOptimizedPath, $project);

            $originalR2Path = $project->originalsBucketPrefix()."/{$originalFileName}";
            $optimizedR2Path = $project->webBucketPrefix()."/{$optimizedFileName}";

            Storage::disk('r2')->put($originalR2Path, fopen($absoluteOriginalPath, 'r'));
            Storage::disk('r2')->put($optimizedR2Path, fopen($absoluteOptimizedPath, 'r'), [
                'ContentType' => 'image/webp',
            ]);

            Photo::create([
                'project_id' => $project->id,
                'url' => $optimizedR2Path,
                'thumbnail_url' => $optimizedR2Path,
                'optimized_path' => $optimizedR2Path,
                'original_path' => $originalR2Path,
                'optimized_bytes' => @filesize($absoluteOptimizedPath) ?: null,
                'original_bytes' => @filesize($absoluteOriginalPath) ?: null,
                'mime_type' => $file->getMimeType(),
                'order_index' => ++$orderIndex,
                'category' => 'Master Set',
                'tags' => ['master-set'],
            ]);
        }

        $project->update([
            'originals_expires_at' => now()->addDays($project->retention_days ?? $project->planDefinition()['retention_days'] ?? 90),
        ]);

        Storage::disk('local')->deleteDirectory($tempMasterDirectory);

        $this->automationService->runImmediate('gallery_published', $project->load('lead', 'client'));

        return redirect()->back(status: 303)->with('success', 'Fotos originales y versiones web sincronizadas en Cloudflare R2.');
    }

    public function toggleHeart(Request $request, Photo $photo)
    {
        $project = $photo->project;
        abort_unless($project && $this->hasClientGalleryAccess($request, $project), 403);
        abort_if($this->isOwnerViewing($request, $project), 403);

        $visitor = $this->registeredVisitor($request, $project);
        abort_unless($visitor, 403);

        $favorite = GalleryFavorite::query()
            ->where('photo_id', $photo->id)
            ->where('client_hash', $visitor['client_hash'])
            ->first();

        if ($favorite) {
            $favorite->delete();
            $action = 'removed';
        } else {
            GalleryFavorite::create([
                'project_id' => $project->id,
                'photo_id' => $photo->id,
                'visitor_email' => $visitor['visitor_email'],
                'client_hash' => $visitor['client_hash'],
            ]);
            $action = 'added';
        }

        GalleryFavoriteLog::create([
            'project_id' => $project->id,
            'photo_id' => $photo->id,
            'visitor_email' => $visitor['visitor_email'],
            'client_hash' => $visitor['client_hash'],
            'action' => $action,
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 65535, ''),
        ]);

        return redirect()->back(status: 303);
    }

    public function updatePhoto(Request $request, Project $project, Photo $photo)
    {
        abort_unless($photo->project_id === $project->id, 404);

        $validated = $request->validate([
            'category' => 'nullable|string|max:255',
            'show_on_website' => 'nullable|boolean',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'people_tags' => 'nullable|array',
            'people_tags.*' => 'string|max:80',
        ]);

        $peopleTags = collect($validated['people_tags'] ?? ($photo->people_tags ?? []))
            ->map(fn ($tag) => trim((string) $tag))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $photo->update([
            'category' => $validated['category'] ?? $photo->category,
            'show_on_website' => (bool) ($validated['show_on_website'] ?? $photo->show_on_website),
            'tags' => collect($validated['tags'] ?? [])
                ->map(fn ($tag) => trim((string) $tag))
                ->filter()
                ->unique()
                ->values()
                ->all(),
            'people_tags' => $peopleTags,
            'recognition_status' => !empty($peopleTags) ? 'manual' : ($photo->recognition_status === 'manual' ? 'pending' : $photo->recognition_status),
            'recognition_note' => !empty($peopleTags) ? 'Etiquetas ajustadas manualmente.' : ($photo->recognition_status === 'manual' ? 'Pendiente de nuevo analisis.' : $photo->recognition_note),
            'recognition_processed_at' => !empty($peopleTags) ? now() : $photo->recognition_processed_at,
        ]);

        return to_route('admin.projects.gallery', $project, 303)->with('success', 'Foto actualizada.');
    }

    public function storeIdentity(Request $request, Project $project)
    {
        if (!$project->face_recognition_enabled) {
            return back(status: 303)->with('error', 'Activa primero el reconocimiento facial para esta galeria.');
        }

        if (!$this->faceRecognitionService->enabled()) {
            return back(status: 303)->with('error', 'Configura la cola Redis del motor IA antes de registrar personas a reconocer.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'reference_image' => 'required|image|mimes:jpeg,jpg,png,webp|max:10000',
        ]);

        $tenant = $this->tenantContext->tenant();

        if ($tenant && !$tenant->canUseFeature('ai_scans')) {
            return back(status: 303)->with('error', 'Tu plan actual alcanzo el limite mensual de analisis IA.');
        }

        $file = $request->file('reference_image');
        $storedPath = $file->storeAs(
            $project->tenant_id
                ? 'tenants/'.$project->tenant_id.'/projects/'.$project->id.'/face-identities'
                : 'face-identities',
            uniqid('identity_', true).'.'.strtolower($file->getClientOriginalExtension() ?: 'jpg'),
            'r2'
        );

        $identity = FaceIdentity::create([
            'project_id' => $project->id,
            'name' => trim((string) $validated['name']),
            'embedding' => null,
            'path_reference' => $storedPath,
            'processing_status' => 'pending',
            'processing_note' => 'Persona enviada a cola para extraer embedding.',
        ]);

        $this->faceRecognitionService->dispatchIdentityExtraction($project, $identity);

        return back(status: 303)->with('success', 'Persona registrada. El motor IA procesara el rostro en segundo plano.');
    }

    public function destroyIdentity(Project $project, FaceIdentity $faceIdentity)
    {
        abort_unless($faceIdentity->project_id === $project->id, 404);

        if ($faceIdentity->path_reference) {
            Storage::disk('r2')->delete($faceIdentity->path_reference);
            Storage::disk('public')->delete($faceIdentity->path_reference);
        }

        $name = $faceIdentity->name;
        $faceIdentity->delete();

        foreach ($project->photos as $photo) {
            $photo->update([
                'people_tags' => collect($photo->people_tags ?? [])
                    ->reject(fn ($tag) => strcasecmp((string) $tag, (string) $name) === 0)
                    ->values()
                    ->all(),
            ]);
        }

        return back(status: 303)->with('success', 'Persona eliminada de esta galeria.');
    }

    public function recognizeProject(Project $project)
    {
        if (!$project->face_recognition_enabled) {
            return back(status: 303)->with('error', 'Activa primero el reconocimiento facial en esta galeria.');
        }

        if (!$this->faceRecognitionService->enabled()) {
            return back(status: 303)->with('error', 'Configura la cola Redis del motor IA antes de analizar la galeria.');
        }

        $project->load('photos', 'faceIdentities');

        if ($project->faceIdentities->isEmpty()) {
            return back(status: 303)->with('error', 'Debes registrar al menos una persona de referencia.');
        }

        $tenant = $this->tenantContext->tenant();
        $photoCount = $project->photos->count();

        if ($tenant && !$tenant->canUseFeature('ai_scans', max(1, $photoCount))) {
            return back(status: 303)->with('error', 'Tu plan actual no tiene capacidad suficiente para encolar este lote de analisis IA.');
        }

        $queued = $this->faceRecognitionService->dispatchProjectRecognition($project);

        return back(status: 303)->with('success', "Se enviaron {$queued} fotos a la cola de reconocimiento facial.");
    }

    public function testRecognition(Project $project)
    {
        try {
            $health = $this->faceRecognitionService->healthCheck();
        } catch (\Throwable $e) {
            return back(status: 303)->with('error', $e->getMessage());
        }

        return back(status: 303)->with('success', 'Cola IA disponible. Driver: '.($health['driver'] ?? 'n/d'));
    }

    public function recognizePhoto(Project $project, Photo $photo)
    {
        abort_unless($photo->project_id === $project->id, 404);

        if (!$project->face_recognition_enabled) {
            return back(status: 303)->with('error', 'Activa primero el reconocimiento facial en esta galeria.');
        }

        if (!$this->faceRecognitionService->enabled()) {
            return back(status: 303)->with('error', 'Configura la cola Redis del motor IA antes de analizar fotos.');
        }

        $project->loadMissing('faceIdentities');

        if ($project->faceIdentities->isEmpty()) {
            return back(status: 303)->with('error', 'Debes registrar al menos una persona de referencia.');
        }

        $tenant = $this->tenantContext->tenant();

        if ($tenant && !$tenant->canUseFeature('ai_scans')) {
            return back(status: 303)->with('error', 'Tu plan actual alcanzo el limite mensual de analisis IA.');
        }

        $this->faceRecognitionService->dispatchPhotoRecognition($project, $photo);

        return back(status: 303)->with('success', "La foto #{$photo->id} fue enviada a la cola de reconocimiento.");
    }

    public function clearPhotoRecognition(Project $project, Photo $photo)
    {
        abort_unless($photo->project_id === $project->id, 404);

        $photo->update([
            'people_tags' => [],
            'recognition_status' => 'pending',
            'recognition_note' => 'Deteccion limpiada manualmente.',
            'recognition_processed_at' => now(),
        ]);

        return back(status: 303)->with('success', "Personas detectadas limpiadas para la foto #{$photo->id}.");
    }

    public function clearProjectRecognition(Project $project)
    {
        $project->photos()->update([
            'people_tags' => json_encode([]),
            'recognition_status' => 'pending',
            'recognition_note' => 'Deteccion limpiada manualmente.',
            'recognition_processed_at' => now(),
        ]);

        return back(status: 303)->with('success', 'Se limpiaron las personas detectadas de toda la galeria.');
    }

    public function destroyPhoto(Project $project, Photo $photo)
    {
        abort_unless($photo->project_id === $project->id, 404);

        if ($photo->optimized_path) {
            Storage::disk('r2')->delete($photo->optimized_path);
        }

        if ($photo->original_path) {
            Storage::disk('r2')->delete($photo->original_path);
        }

        if ($project->hero_photo_id === $photo->id) {
            $project->update(['hero_photo_id' => null]);
        }

        $photo->delete();

        return to_route('admin.projects.gallery', $project, 303)->with('success', 'Foto eliminada.');
    }

    public function download(Request $request, Photo $photo)
    {
        $project = $photo->project;
        abort_unless($project, 404);
        abort_unless($this->hasClientGalleryAccess($request, $project), 403, 'Debes desbloquear la galeria del cliente para descargar originales.');

        if ($project->originalsExpired() || !$photo->original_path) {
            abort(403, 'Periodo de descarga de alta resolucion finalizado.');
        }

        $visitor = $this->registeredVisitor($request, $project);
        $clientHash = $this->clientHash($request, $project);
        $weeklyLimit = $project->effectiveWeeklyDownloadLimit();

        if ($weeklyLimit !== null) {
            $downloadsInWindow = DownloadLog::query()
                ->where('project_id', $project->id)
                ->where('client_hash', $clientHash)
                ->where('created_at', '>=', now()->subDays(7))
                ->count();

            if ($downloadsInWindow >= $weeklyLimit) {
                abort(403, 'Limite semanal alcanzado.');
            }
        }

        DownloadLog::create([
            'project_id' => $project->id,
            'photo_id' => $photo->id,
            'asset_type' => 'photo',
            'client_hash' => $clientHash,
            'visitor_email' => $visitor['visitor_email'] ?? null,
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 65535, ''),
        ]);

        $photo->increment('download_count');

        try {
            $temporaryUrl = Storage::disk('r2')->temporaryUrl($photo->original_path, now()->addMinutes(5));

            return redirect()->away($temporaryUrl);
        } catch (\Throwable $e) {
            abort(500, 'No fue posible preparar la descarga del original.');
        }
    }

    public function downloadFullGallery($token)
    {
        abort(403, 'La descarga desde la galeria esta deshabilitada.');
    }

    private function createOptimizedWebp(string $originalPath, string $optimizedPath, Project $project): void
    {
        $imageInfo = @getimagesize($originalPath);
        $image = null;

        if ($imageInfo) {
            if ($imageInfo['mime'] === 'image/jpeg') {
                $image = imagecreatefromjpeg($originalPath);
            } elseif ($imageInfo['mime'] === 'image/png') {
                $image = imagecreatefrompng($originalPath);
            } elseif ($imageInfo['mime'] === 'image/webp') {
                $image = imagecreatefromwebp($originalPath);
            }
        }

        if (!$image) {
            copy($originalPath, $optimizedPath);
            return;
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $maxDimension = 2200;

        if ($width > $maxDimension || $height > $maxDimension) {
            $ratio = min($maxDimension / $width, $maxDimension / $height);
            $newWidth = max(1, (int) round($width * $ratio));
            $newHeight = max(1, (int) round($height * $ratio));

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resized;
        }

        $this->applyWatermark($image, $project);

        $quality = 78;
        imagewebp($image, $optimizedPath, $quality);

        while (@filesize($optimizedPath) > 500 * 1024 && $quality > 50) {
            $quality -= 5;
            imagewebp($image, $optimizedPath, $quality);
        }

        imagedestroy($image);
    }

    private function serializePhoto(Photo $photo, bool $hasClientAccess, array $selectedPhotoIds = []): array
    {
        return [
            ...$photo->toArray(),
            'is_selected' => in_array($photo->id, $selectedPhotoIds, true),
            'url' => $photo->optimized_path ? $this->temporaryUrlOrFallback($photo->optimized_path) : $photo->url,
            'thumbnail_url' => $photo->optimized_path ? $this->temporaryUrlOrFallback($photo->optimized_path) : $photo->thumbnail_url,
            'high_res_available' => $hasClientAccess && (bool) $photo->original_path && !$photo->project?->originalsExpired(),
        ];
    }

    private function hasClientGalleryAccess(Request $request, ?Project $project): bool
    {
        if (!$project) {
            return false;
        }

        if ($this->isOwnerViewing($request, $project)) {
            return true;
        }

        return (bool) $request->session()->get($this->gallerySessionKey($project), false);
    }

    private function isOwnerViewing(Request $request, Project $project): bool
    {
        $user = $request->user();

        if (!$user) {
            return false;
        }

        return $project->owner_user_id === $user->id || $user->isDeveloper();
    }

    private function gallerySessionKey(Project $project): string
    {
        return 'gallery_client_access.'.$project->gallery_token;
    }

    private function paginatePhotos(Request $request, Project $project, bool $hasClientAccess): LengthAwarePaginator
    {
        $perPage = $this->galleryPerPage($hasClientAccess);

        return $project->photos()
            ->when(!$hasClientAccess, fn ($query) => $query->where('show_on_website', true))
            ->paginate($perPage)
            ->withQueryString();
    }

    private function galleryPerPage(bool $hasClientAccess): int
    {
        return $hasClientAccess ? 20 : 12;
    }

    private function temporaryUrlOrFallback(string $path): string
    {
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        try {
            return Storage::disk('r2')->temporaryUrl($path, now()->addMinutes(60));
        } catch (\Throwable $e) {
            // Fall back to the raw path below.
        }

        return $path;
    }

    private function seedMockPhotos(Project $project): void
    {
        $categories = ['Ceremony', 'Portraits', 'Candid', 'Detail'];

        for ($i = 1; $i <= 12; $i++) {
            Photo::create([
                'project_id' => $project->id,
                'url' => 'https://picsum.photos/seed/'.($project->id + $i).'/1200/800',
                'thumbnail_url' => 'https://picsum.photos/seed/'.($project->id + $i).'/400/300',
                'order_index' => $i,
                'category' => $categories[$i % 4],
                'tags' => [strtolower($categories[$i % 4])],
            ]);
        }
    }

    private function clientHash(Request $request, Project $project): string
    {
        if ($registeredVisitor = $this->registeredVisitor($request, $project)) {
            return $registeredVisitor['client_hash'];
        }

        return hash('sha256', implode('|', [
            $project->id,
            $request->ip(),
            substr((string) $request->userAgent(), 0, 255),
        ]));
    }

    private function clientHashFromEmail(Project $project, string $email): string
    {
        return hash('sha256', implode('|', [
            $project->id,
            strtolower(trim($email)),
        ]));
    }

    private function registeredVisitor(Request $request, Project $project): ?array
    {
        $payload = $request->session()->get($this->registrationSessionKey($project));

        if (!is_array($payload) || blank($payload['visitor_email'] ?? null) || blank($payload['client_hash'] ?? null)) {
            return null;
        }

        return $payload;
    }

    private function registrationSessionKey(Project $project): string
    {
        return 'gallery_registration.'.$project->gallery_token;
    }

    private function applyWatermark(\GdImage $image, Project $project): void
    {
        $mode = $project->planDefinition()['watermark_mode'] ?? null;

        if ($mode === 'platform_forced') {
            $this->applyTextWatermark($image, Setting::get('platform_watermark_label', 'PhotOS'));
            return;
        }

        if ($mode === 'photographer_custom') {
            $watermarkPath = Setting::get('photographer_watermark_path');

            if ($watermarkPath) {
                $absolutePath = storage_path('app/public/'.$watermarkPath);

                if (file_exists($absolutePath) && $this->applyImageWatermark($image, $absolutePath)) {
                    return;
                }
            }

            $this->applyTextWatermark($image, 'Studio');
        }
    }

    private function applyTextWatermark(\GdImage $image, string $label): void
    {
        $label = trim($label) ?: 'PhotOS';
        $width = imagesx($image);
        $height = imagesy($image);
        $font = 5;
        $textWidth = imagefontwidth($font) * strlen($label);
        $textHeight = imagefontheight($font);
        $padding = max(18, (int) round(min($width, $height) * 0.025));
        $x = max(10, $width - $textWidth - $padding);
        $y = max(10, $height - $textHeight - $padding);

        $shadow = imagecolorallocatealpha($image, 0, 0, 0, 80);
        $text = imagecolorallocatealpha($image, 255, 255, 255, 70);

        imagestring($image, $font, $x + 1, $y + 1, $label, $shadow);
        imagestring($image, $font, $x, $y, $label, $text);
    }

    private function applyImageWatermark(\GdImage $image, string $watermarkPath): bool
    {
        $mime = @mime_content_type($watermarkPath);
        $watermark = null;

        if ($mime === 'image/png') {
            $watermark = @imagecreatefrompng($watermarkPath);
        } elseif ($mime === 'image/webp') {
            $watermark = @imagecreatefromwebp($watermarkPath);
        }

        if (!$watermark) {
            return false;
        }

        imagealphablending($image, true);
        imagesavealpha($image, true);

        $imageWidth = imagesx($image);
        $imageHeight = imagesy($image);
        $wmWidth = imagesx($watermark);
        $wmHeight = imagesy($watermark);

        $targetWidth = max(120, (int) round($imageWidth * 0.18));
        $ratio = min($targetWidth / max(1, $wmWidth), ($imageHeight * 0.16) / max(1, $wmHeight));
        $drawWidth = max(1, (int) round($wmWidth * $ratio));
        $drawHeight = max(1, (int) round($wmHeight * $ratio));
        $padding = max(18, (int) round(min($imageWidth, $imageHeight) * 0.025));
        $destX = $imageWidth - $drawWidth - $padding;
        $destY = $imageHeight - $drawHeight - $padding;

        imagecopyresampled(
            $image,
            $watermark,
            $destX,
            $destY,
            0,
            0,
            $drawWidth,
            $drawHeight,
            $wmWidth,
            $wmHeight
        );

        imagedestroy($watermark);

        return true;
    }

    private function hasConfiguredR2(): bool
    {
        return filled(Setting::get('r2_key'))
            && filled(Setting::get('r2_secret'))
            && filled(Setting::get('r2_bucket'))
            && filled(Setting::get('r2_endpoint'));
    }

    private function applyRecognitionResult(Photo $photo, array $people, ?string $error = null): void
    {
        $people = collect($people)->map(fn ($name) => trim((string) $name))->filter()->unique()->values()->all();

        if ($error) {
            $status = str_contains(mb_strtolower($error), 'ningun rostro') ? 'no_face' : 'error';
            $note = $error;
        } elseif (!empty($people)) {
            $status = 'matched';
            $note = 'Coincidencias detectadas: '.implode(', ', $people).'.';
        } else {
            $status = 'no_match';
            $note = 'Se analizo la foto pero no hubo coincidencias con las personas registradas.';
        }

        $photo->update([
            'people_tags' => $people,
            'recognition_status' => $status,
            'recognition_note' => $note,
            'recognition_processed_at' => now(),
        ]);
    }
}
