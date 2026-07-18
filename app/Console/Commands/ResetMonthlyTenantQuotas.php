<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;

class ResetMonthlyTenantQuotas extends Command
{
    protected $signature = 'tenants:reset-monthly-quotas {--dry-run : Mostrar cuantos tenants se resetean sin modificar}';

    protected $description = 'Resetea contadores mensuales (AI scans) de los tenants cuyo ciclo vencio';

    public function handle(): int
    {
        $query = Tenant::query()
            ->whereNotNull('ai_scans_reset_at')
            ->where('ai_scans_reset_at', '<=', now());

        $count = $query->count();

        if ($this->option('dry-run')) {
            $this->info("Dry-run: {$count} tenant(s) pendientes de reset.");
            return self::SUCCESS;
        }

        $nextReset = now()->startOfMonth()->addMonth();

        $query->update([
            'ai_scans_monthly_count' => 0,
            'ai_scans_reset_at'      => $nextReset,
        ]);

        $this->info("Reset completado: {$count} tenant(s) — proximo ciclo: {$nextReset->toDateString()}.");

        return self::SUCCESS;
    }
}
