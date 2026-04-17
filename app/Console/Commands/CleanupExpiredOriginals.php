<?php

namespace App\Console\Commands;

use App\Models\Photo;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupExpiredOriginals extends Command
{
    protected $signature = 'gallery:cleanup-originals';

    protected $description = 'Aplica vencimientos SaaS y limpia originales pesados en R2 sin tocar miniaturas web.';

    public function handle(): int
    {
        $annualDeleted = $this->deleteOriginalsOlderThanOneYear();
        $graceTenants = $this->syncExpiredSubscriptions();
        $purgedTenants = $this->purgeExpiredTenantOriginals();

        $this->info("Originales anuales borrados: {$annualDeleted}");
        $this->info("Tenants movidos a grace_period: {$graceTenants}");
        $this->info("Tenants con purga definitiva: {$purgedTenants}");

        return self::SUCCESS;
    }

    private function deleteOriginalsOlderThanOneYear(): int
    {
        $deleted = 0;

        Photo::withoutGlobalScope('tenant')
            ->whereNotNull('original_path')
            ->where('created_at', '<=', now()->subDays(365))
            ->with('project.tenant')
            ->chunkById(100, function ($photos) use (&$deleted) {
                foreach ($photos as $photo) {
                    $tenant = $photo->project?->tenant;
                    $this->configureR2RootForTenant($tenant);
                    Storage::disk('r2')->delete($photo->original_path);
                    $photo->update(['original_path' => null, 'original_bytes' => null]);
                    $deleted++;
                }
            });

        return $deleted;
    }

    private function syncExpiredSubscriptions(): int
    {
        $moved = 0;

        TenantSubscription::query()
            ->with('tenant')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->chunkById(100, function ($subscriptions) use (&$moved) {
                foreach ($subscriptions as $subscription) {
                    $tenant = $subscription->tenant;
                    if (! $tenant) {
                        continue;
                    }

                    $graceEndsAt = $subscription->expires_at->copy()->addDays(15);
                    $tenant->update([
                        'status' => 'grace_period',
                        'grace_period_ends_at' => $graceEndsAt,
                    ]);

                    $subscription->update([
                        'status' => 'past_due',
                        'grace_ends_at' => $graceEndsAt,
                    ]);
                    $moved++;
                }
            });

        return $moved;
    }

    private function purgeExpiredTenantOriginals(): int
    {
        $purged = 0;

        TenantSubscription::query()
            ->with('tenant')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now()->subDays(15))
            ->chunkById(50, function ($subscriptions) use (&$purged) {
                foreach ($subscriptions as $subscription) {
                    $tenant = $subscription->tenant;
                    if (! $tenant) {
                        continue;
                    }

                    $this->configureR2RootForTenant($tenant);

                    Photo::withoutGlobalScope('tenant')
                        ->where('tenant_id', $tenant->id)
                        ->whereNotNull('original_path')
                        ->chunkById(100, function ($photos) {
                            foreach ($photos as $photo) {
                                Storage::disk('r2')->delete($photo->original_path);
                                $photo->update(['original_path' => null, 'original_bytes' => null]);
                            }
                        });

                    $tenant->update(['status' => 'grace_period', 'grace_period_ends_at' => $subscription->expires_at->copy()->addDays(15)]);
                    $purged++;
                }
            });

        return $purged;
    }

    private function configureR2RootForTenant(?Tenant $tenant): void
    {
        if (! $tenant?->slug) {
            return;
        }

        config(['filesystems.disks.r2.root' => "tenants/{$tenant->slug}"]);
        Storage::forgetDisk('r2');
    }
}
