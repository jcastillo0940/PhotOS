<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('saas:delete-tenant {slug} {--force : No pedir confirmacion}')]
#[Description('Elimina por completo un Tenant (estudio) y TODOS sus datos asociados (Testing purposes)')]
class DeleteTenantCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $slug = $this->argument('slug');
        $tenant = Tenant::where('slug', $slug)->first();

        if (!$tenant) {
            $this->error("No se encontro ningun tenant con el slug: {$slug}");
            return Command::FAILURE;
        }

        if (!$this->option('force') && !$this->confirm("Estas a punto de eliminar ABSOLUTAMENTE TODO el estudio '{$tenant->name}' ({$slug}). ¿Deseas continuar?")) {
            $this->info('Operacion cancelada.');
            return Command::SUCCESS;
        }

        $this->info("Eliminando datos del tenant: {$tenant->name}...");

        $userCount = $tenant->users()->count();
        $domainCount = $tenant->domains()->count();
        
        $tenant->delete();

        $this->info("✔ Tenant eliminado exitosamente.");
        $this->info("✔ {$userCount} usuario(s) asociado(s) eliminados.");
        $this->info("✔ {$domainCount} dominio(s) asociado(s) eliminados.");

        return Command::SUCCESS;
    }
}
