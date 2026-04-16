<?php

namespace App\Console\Commands;

use App\Models\FaceIdentity;
use App\Models\Photo;
use App\Models\Project;
use App\Models\Setting;
use App\Services\FaceRecognitionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;

class DiagnoseFaceAiFlow extends Command
{
    protected $signature = 'face-ai:diagnose
        {--project= : ID del proyecto a inspeccionar}
        {--identity= : ID de la identidad a inspeccionar}
        {--queue-sample=3 : Cantidad de mensajes de muestra por cola}
        {--json : Devuelve todo el reporte como JSON}';

    protected $description = 'Diagnostica de punta a punta el flujo IA de personas, marcas y sponsors sin modificar datos';

    public function handle(FaceRecognitionService $service): int
    {
        $report = $this->buildReport($service);

        if ($this->option('json')) {
            $this->line(json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

            return self::SUCCESS;
        }

        $this->info('Diagnostico Face AI');
        $this->newLine();

        $this->line('Entorno: '.json_encode($report['environment'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $this->line('Servicio: '.json_encode($report['service'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $this->line('Catalogos: '.json_encode($report['catalogs'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $this->line('Colas: '.json_encode($report['queues'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $this->newLine();

        $this->info('Identidades');
        foreach ($report['identities'] as $identity) {
            $this->line(json_encode($identity, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        }

        $this->newLine();
        $this->info('Proyectos IA');
        foreach ($report['projects'] as $project) {
            $this->line(json_encode($project, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        }

        $this->newLine();
        $this->info('Fotos recientes');
        foreach ($report['photos'] as $photo) {
            $this->line(json_encode($photo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        }

        $this->newLine();
        $this->warn('Resumen');
        foreach ($report['summary'] as $line) {
            $this->line('- '.$line);
        }

        return self::SUCCESS;
    }

    private function buildReport(FaceRecognitionService $service): array
    {
        $projectId = $this->option('project') ? (int) $this->option('project') : null;
        $identityId = $this->option('identity') ? (int) $this->option('identity') : null;
        $queueSample = max(1, (int) $this->option('queue-sample'));

        $health = null;
        $healthError = null;

        try {
            $health = $service->healthCheck();
        } catch (\Throwable $e) {
            $healthError = $e->getMessage();
        }

        $redis = Redis::connection((string) config('services.face_ai.redis_connection', 'default'));
        $taskQueue = (string) config('services.face_ai.task_queue', 'face-ai:tasks');
        $resultQueue = (string) config('services.face_ai.result_queue', 'face-ai:results');

        $identitiesQuery = FaceIdentity::withoutGlobalScope('tenant')
            ->when($identityId, fn ($query) => $query->where('id', $identityId))
            ->latest('id');

        $projectsQuery = Project::withoutGlobalScope('tenant')
            ->when($projectId, fn ($query) => $query->where('id', $projectId))
            ->when(!$projectId, fn ($query) => $query->where('face_recognition_enabled', true))
            ->latest('id');

        $photosQuery = Photo::withoutGlobalScope('tenant')
            ->when($projectId, fn ($query) => $query->where('project_id', $projectId))
            ->latest('id');

        $identities = $identitiesQuery->get([
            'id',
            'tenant_id',
            'project_id',
            'name',
            'processing_status',
            'processing_note',
            'processed_at',
            'path_reference',
            'embedding',
        ])->map(function (FaceIdentity $identity) {
            $existsR2 = null;
            $temporaryUrlError = null;

            try {
                if ($identity->path_reference) {
                    $this->configureR2ForTenant($identity->tenant_id);
                    $existsR2 = Storage::disk('r2')->exists($identity->path_reference);
                }
            } catch (\Throwable $e) {
                $temporaryUrlError = $e->getMessage();
            }

            return [
                'id' => $identity->id,
                'tenant_id' => $identity->tenant_id,
                'project_id' => $identity->project_id,
                'name' => $identity->name,
                'processing_status' => $identity->processing_status,
                'processing_note' => $identity->processing_note,
                'processed_at' => optional($identity->processed_at)?->toIso8601String(),
                'path_reference' => $identity->path_reference,
                'exists_r2' => $existsR2,
                'has_embedding' => is_array($identity->embedding) && !empty($identity->embedding),
                'storage_check_error' => $temporaryUrlError,
            ];
        })->values()->all();

        $projects = $projectsQuery->get([
            'id',
            'tenant_id',
            'name',
            'face_recognition_enabled',
        ])->map(fn (Project $project) => [
            'id' => $project->id,
            'tenant_id' => $project->tenant_id,
            'name' => $project->name,
            'face_recognition_enabled' => (bool) $project->face_recognition_enabled,
            'photos_count' => $project->photos()->count(),
            'database_ready' => $service->hasRecognitionDatabase($project),
            'ready_identities_count' => FaceIdentity::withoutGlobalScope('tenant')
                ->where('tenant_id', $project->tenant_id)
                ->whereNotNull('embedding')
                ->where(function ($query) use ($project) {
                    $query->whereNull('project_id')->orWhere('project_id', $project->id);
                })
                ->count(),
        ])->values()->all();

        $photos = $photosQuery->take(15)->get([
            'id',
            'project_id',
            'recognition_status',
            'recognition_note',
            'recognition_processed_at',
            'people_tags',
            'brand_tags',
            'sponsor_tags',
        ])->map(fn (Photo $photo) => [
            'id' => $photo->id,
            'project_id' => $photo->project_id,
            'recognition_status' => $photo->recognition_status,
            'recognition_note' => $photo->recognition_note,
            'recognition_processed_at' => optional($photo->recognition_processed_at)?->toIso8601String(),
            'people_tags' => $photo->people_tags,
            'brand_tags' => $photo->brand_tags,
            'sponsor_tags' => $photo->sponsor_tags,
        ])->values()->all();

        $brandCatalog = $this->decodeCatalog('ai_brand_catalog');
        $sponsorCatalog = $this->decodeCatalog('ai_sponsor_catalog');

        $report = [
            'environment' => [
                'app_env' => app()->environment(),
                'app_url' => config('app.url'),
                'db' => config('database.connections.mysql.database'),
                'queue_connection' => config('queue.default'),
                'redis_host' => config('database.redis.default.host'),
                'redis_port' => config('database.redis.default.port'),
                'redis_db' => config('database.redis.default.database'),
            ],
            'service' => [
                'enabled' => $service->enabled(),
                'health' => $health,
                'health_error' => $healthError,
                'face_detection_scope' => Setting::withoutGlobalScope('tenant')->whereNull('tenant_id')->where('key', 'face_detection_scope')->value('value') ?? 'project_only',
                'sports_mode' => Setting::withoutGlobalScope('tenant')->whereNull('tenant_id')->where('key', 'ai_sports_mode_enabled')->value('value') ?? '0',
            ],
            'catalogs' => [
                'brands_count' => count($brandCatalog),
                'sponsors_count' => count($sponsorCatalog),
                'brands' => array_slice(array_map(fn ($item) => $item['name'] ?? null, $brandCatalog), 0, 10),
                'sponsors' => array_slice(array_map(fn ($item) => $item['name'] ?? null, $sponsorCatalog), 0, 10),
            ],
            'queues' => [
                'task_queue' => $taskQueue,
                'result_queue' => $resultQueue,
                'tasks_waiting' => $redis->llen($taskQueue),
                'results_waiting' => $redis->llen($resultQueue),
                'task_sample' => $this->queueSample($redis, $taskQueue, $queueSample),
                'result_sample' => $this->queueSample($redis, $resultQueue, $queueSample),
            ],
            'identities' => $identities,
            'projects' => $projects,
            'photos' => $photos,
        ];

        $report['summary'] = $this->buildSummary($report);

        return $report;
    }

    private function decodeCatalog(string $key): array
    {
        $value = Setting::withoutGlobalScope('tenant')
            ->whereNull('tenant_id')
            ->where('key', $key)
            ->value('value');

        $decoded = json_decode((string) ($value ?? '[]'), true);

        return is_array($decoded) ? $decoded : [];
    }

    private function queueSample($redis, string $queue, int $limit): array
    {
        $messages = [];

        for ($i = 0; $i < $limit; $i++) {
            $messages[] = $redis->lindex($queue, $i);
        }

        return $messages;
    }

    private function configureR2ForTenant(?int $tenantId): void
    {
        if (! $tenantId) {
            return;
        }

        $tenant = \App\Models\Tenant::withoutGlobalScope('tenant')->find($tenantId);
        if ($tenant?->slug) {
            config(['filesystems.disks.r2.root' => "tenants/{$tenant->slug}"]);
            Storage::forgetDisk('r2');
        }
    }

    private function buildSummary(array $report): array
    {
        $lines = [];

        if (!($report['service']['enabled'] ?? false)) {
            $lines[] = 'El servicio Face AI no esta habilitado segun la configuracion actual.';
        }

        if (($report['service']['health_error'] ?? null) !== null) {
            $lines[] = 'El health check del servicio fallo: '.$report['service']['health_error'];
        }

        if (($report['catalogs']['brands_count'] ?? 0) === 0) {
            $lines[] = 'No hay catalogo de marcas cargado.';
        }

        if (($report['catalogs']['sponsors_count'] ?? 0) === 0) {
            $lines[] = 'No hay catalogo de sponsors cargado.';
        }

        foreach ($report['identities'] as $identity) {
            if (($identity['exists_r2'] ?? null) === false) {
                $lines[] = "La identidad {$identity['id']} ({$identity['name']}) apunta a un archivo inexistente en R2.";
            }

            if (($identity['processing_status'] ?? null) !== 'ready') {
                $lines[] = "La identidad {$identity['id']} ({$identity['name']}) no esta lista. Estado: ".($identity['processing_status'] ?? 'n/d').'.';
            }
        }

        foreach ($report['projects'] as $project) {
            if (!($project['database_ready'] ?? false)) {
                $lines[] = "El proyecto {$project['id']} ({$project['name']}) no tiene base de reconocimiento lista.";
            }
        }

        if (empty($lines)) {
            $lines[] = 'No se detectaron bloqueos obvios en el flujo IA.';
        }

        return array_values(array_unique($lines));
    }
}
