<?php

namespace App\Console\Commands;

use App\Models\SaasPlan;
use App\Models\SaasRegistration;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncLegacySaasPlansCommand extends Command
{
    protected $signature = 'saas:sync-legacy-plans {--dry-run : Only report the changes without persisting them}';

    protected $description = 'Map legacy SaaS plan codes to the SaaS v2 catalog for tenants, subscriptions, registrations, and plans';

    private const MAP = [
        'studio' => 'starter',
        'professional' => 'pro',
        'studio_gold' => 'business',
        'scale' => 'enterprise',
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->components->info($dryRun
            ? 'Analizando compatibilidad de planes legacy en modo dry-run...'
            : 'Sincronizando planes legacy hacia el catalogo SaaS v2...');

        $changes = [
            'tenants' => $this->syncModel(Tenant::withoutGlobalScopes(), 'plan_code', $dryRun),
            'subscriptions' => $this->syncModel(TenantSubscription::withoutGlobalScopes(), 'plan_code', $dryRun),
            'registrations' => $this->syncModel(SaasRegistration::withoutGlobalScopes(), 'plan_code', $dryRun),
            'plans' => $this->syncPlanTable($dryRun),
        ];

        foreach ($changes as $label => $count) {
            $this->line(ucfirst($label).": {$count}");
        }

        $this->newLine();
        $this->components->info($dryRun ? 'Dry-run completado.' : 'Sincronizacion completada.');

        return self::SUCCESS;
    }

    private function syncModel($query, string $column, bool $dryRun): int
    {
        $count = 0;

        foreach (self::MAP as $legacy => $current) {
            $matches = (clone $query)->where($column, $legacy)->get();

            foreach ($matches as $model) {
                $count++;

                if ($dryRun) {
                    continue;
                }

                $model->forceFill([$column => $current])->save();
            }
        }

        return $count;
    }

    private function syncPlanTable(bool $dryRun): int
    {
        $count = 0;

        foreach (self::MAP as $legacy => $current) {
            $legacyPlan = SaasPlan::withoutGlobalScopes()->where('code', $legacy)->first();
            $currentPlan = SaasPlan::withoutGlobalScopes()->where('code', $current)->first();

            if (! $legacyPlan) {
                continue;
            }

            $count++;

            if ($dryRun) {
                continue;
            }

            if ($currentPlan) {
                DB::transaction(function () use ($legacyPlan) {
                    $legacyPlan->delete();
                });

                continue;
            }

            $legacyPlan->forceFill(['code' => $current])->save();
        }

        return $count;
    }
}
