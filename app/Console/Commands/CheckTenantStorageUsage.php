<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckTenantStorageUsage extends Command
{
    protected $signature = 'saas:check-storage';
    protected $description = 'Monitorea el uso de almacenamiento de los tenants y envia alertas al 90%';

    public function handle(): void
    {
        $tenants = Tenant::where('status', 'active')->get();

        foreach ($tenants as $tenant) {
            $usage = $tenant->calculateCurrentStorageUsage();
            $limitGb = (int) $tenant->featureLimit('storage_gb');
            $limitBytes = $limitGb * 1024 * 1024 * 1024;

            if ($limitBytes > 0) {
                $percent = ($usage / $limitBytes) * 100;

                if ($percent >= 90) {
                    $this->info("Tenant {$tenant->name} esta al " . round($percent, 2) . "%");
                    
                    // Logic to send email
                    // Mail::to($tenant->billing_email)->send(new StorageAlertMail($tenant, $percent));
                    
                    Log::channel('single')->warning("Tenant {$tenant->name} ({$tenant->slug}) ha superado el 90% de su almacenamiento R2. Uso: " . round($percent, 2) . "%");
                }
            }
        }
        
        $this->info('Chequeo de almacenamiento completado.');
    }
}
