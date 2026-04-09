<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Models\TenantDomain;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class CreateTenant extends Command
{
    protected $signature = 'saas:tenant:create
        {name : Nombre comercial del tenant}
        {--slug= : Slug unico del tenant}
        {--domain=* : Uno o varios dominios para el tenant}
        {--plan=starter : Codigo del plan}
        {--billing-email= : Correo de facturacion}
        {--storage-limit=0 : Limite de almacenamiento en bytes}
        {--ai-enabled=1 : 1 para habilitar IA, 0 para deshabilitar}
        {--custom-domain-enabled=1 : 1 para permitir dominio propio, 0 para deshabilitar}';

    protected $description = 'Crea un tenant SaaS con sus dominios iniciales.';

    public function handle(): int
    {
        $name = trim((string) $this->argument('name'));
        $slug = trim((string) ($this->option('slug') ?: Str::slug($name)));
        $domains = collect($this->option('domain'))
            ->map(fn ($domain) => trim(strtolower((string) $domain)))
            ->filter()
            ->unique()
            ->values();

        if ($domains->isEmpty()) {
            $this->error('Debes indicar al menos un dominio con --domain=');

            return self::FAILURE;
        }

        if (Tenant::query()->where('slug', $slug)->exists()) {
            $this->error("Ya existe un tenant con slug {$slug}.");

            return self::FAILURE;
        }

        $tenant = Tenant::create([
            'name' => $name,
            'slug' => $slug,
            'status' => 'active',
            'plan_code' => (string) $this->option('plan'),
            'billing_email' => $this->option('billing-email') ?: null,
            'storage_limit_bytes' => (int) $this->option('storage-limit'),
            'ai_enabled' => (bool) ((int) $this->option('ai-enabled')),
            'custom_domain_enabled' => (bool) ((int) $this->option('custom-domain-enabled')),
            'metadata' => [
                'created_via' => 'artisan',
            ],
        ]);

        foreach ($domains as $index => $domain) {
            TenantDomain::create([
                'tenant_id' => $tenant->id,
                'hostname' => $domain,
                'type' => $index === 0 ? 'primary' : 'custom',
                'is_primary' => $index === 0,
                'cf_status' => 'pending',
                'metadata' => [
                    'created_via' => 'artisan',
                ],
            ]);
        }

        $this->info("Tenant {$tenant->name} creado con ID {$tenant->id}.");
        $this->line('Dominios:');

        foreach ($domains as $domain) {
            $this->line("- {$domain}");
        }

        return self::SUCCESS;
    }
}
