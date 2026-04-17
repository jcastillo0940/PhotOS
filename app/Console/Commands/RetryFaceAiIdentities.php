<?php

namespace App\Console\Commands;

use App\Jobs\DispatchFaceRecognitionTaskJob;
use App\Models\FaceIdentity;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;

class RetryFaceAiIdentities extends Command
{
    protected $signature = 'face-ai:retry-identities
        {--tenant= : ID del tenant (deja vacío para todos)}
        {--purge-queue : Vacía la cola face-ai:tasks:identity antes de re-encolar}
        {--dry-run : Solo muestra lo que haría sin modificar datos}';

    protected $description = 'Limpia tareas huérfanas de Redis y re-encola identidades pendientes con URLs frescas';

    public function handle(): int
    {
        $tenantId  = $this->option('tenant') ? (int) $this->option('tenant') : null;
        $purge     = (bool) $this->option('purge-queue');
        $dryRun    = (bool) $this->option('dry-run');
        $taskQueue = (string) config('services.face_ai.identity_task_queue', 'face-ai:tasks:identity');
        $redis     = Redis::connection((string) config('services.face_ai.redis_connection', 'default'));

        if ($dryRun) {
            $this->warn('[DRY-RUN] No se modificará nada.');
        }

        // 1. Vaciar cola si se pide
        if ($purge) {
            $waiting = $redis->llen($taskQueue);
            $this->line("Cola '{$taskQueue}' tiene {$waiting} tarea(s) pendientes.");

            if (! $dryRun) {
                $redis->del($taskQueue);
                $this->info("Cola '{$taskQueue}' vaciada.");
            } else {
                $this->line("[DRY-RUN] Se eliminarían {$waiting} tareas de la cola.");
            }
        }

        // 2. Buscar identidades que necesitan reintento
        $query = FaceIdentity::withoutGlobalScope('tenant')
            ->whereIn('processing_status', ['queued', 'error'])
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->orderBy('id');

        $identities = $query->get(['id', 'tenant_id', 'project_id', 'name', 'path_reference', 'processing_status']);

        if ($identities->isEmpty()) {
            $this->info('No hay identidades pendientes de procesar.');
            return self::SUCCESS;
        }

        $this->info("Identidades a re-encolar: {$identities->count()}");

        $dispatched = 0;
        $skipped    = 0;

        foreach ($identities as $identity) {
            // Verificar que el archivo existe en R2 con el root del tenant correcto
            $exists = $this->existsInR2($identity);

            $status = $exists ? 'OK' : 'MISSING';
            $this->line("  [{$status}] ID={$identity->id} name={$identity->name} path={$identity->path_reference}");

            if (! $exists) {
                $skipped++;
                if (! $dryRun) {
                    $identity->update([
                        'processing_status' => 'error',
                        'processing_note'   => 'Archivo de referencia no encontrado en R2.',
                    ]);
                }
                continue;
            }

            if (! $dryRun) {
                // Resetear estado para que el Job genere URL fresca
                $identity->update([
                    'processing_status' => 'pending',
                    'processing_note'   => null,
                    'processed_at'      => null,
                    'embedding'         => null,
                ]);

                DispatchFaceRecognitionTaskJob::dispatch('extract_identity', $identity->project_id, null, $identity->id);
            }

            $dispatched++;
        }

        $this->newLine();
        $this->info("Re-encoladas: {$dispatched} | Omitidas (no existen en R2): {$skipped}");

        return self::SUCCESS;
    }

    private function existsInR2(FaceIdentity $identity): bool
    {
        if (blank($identity->path_reference)) {
            return false;
        }

        $tenant = $identity->tenant_id
            ? Tenant::withoutGlobalScope('tenant')->find($identity->tenant_id)
            : null;

        if ($tenant?->slug) {
            config(['filesystems.disks.r2.root' => "tenants/{$tenant->slug}"]);
            Storage::forgetDisk('r2');
        }

        try {
            return Storage::disk('r2')->exists($identity->path_reference);
        } catch (\Throwable) {
            return false;
        }
    }
}
