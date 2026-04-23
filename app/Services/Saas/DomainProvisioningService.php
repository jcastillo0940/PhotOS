<?php

namespace App\Services\Saas;

use App\Jobs\SyncDomainProvisioningJob;
use App\Models\DomainOrder;
use App\Models\Tenant;
use App\Models\TenantDomain;
use Illuminate\Support\Str;
use RuntimeException;

class DomainProvisioningService
{
    public function __construct(
        private readonly CloudflareCustomHostnameService $customHostnames,
        private readonly CloudflareRegistrarService $registrar,
        private readonly CloudflareDnsService $dns,
    ) {
    }

    public function purchaseAndProvision(Tenant $tenant, string $domainName): DomainOrder
    {
        $this->assertCustomDomainEnabled($tenant);

        $domainName = $this->normalizeDomain($domainName);

        $order = DomainOrder::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'domain_name' => $domainName,
                'type' => 'purchase',
            ],
            [
                'provider' => 'cloudflare',
                'status' => 'registering',
                'error_message' => null,
                'notes' => null,
                'verification_attempts' => 0,
                'last_checked_at' => null,
                'next_check_at' => null,
                'manual_state' => null,
                'metadata' => ['flow' => 'purchase'],
            ]
        );

        try {
            $registration = $this->registrar->registerDomain($domainName);

            $order->forceFill([
                'status' => 'registered',
                'registrar_reference' => $registration['id'] ?? $registration['domain_name'] ?? $domainName,
                'amount' => $registration['price'] ?? data_get($registration, 'pricing.purchase'),
                'currency' => $registration['currency'] ?? 'USD',
                'metadata' => array_merge($order->metadata ?? [], [
                    'registration' => $registration,
                ]),
            ])->save();

            $tenantDomain = $this->ensureTenantCustomHostname($tenant, $domainName, 'tenant-domain-purchase');

            $order->forceFill([
                'tenant_domain_id' => $tenantDomain->id,
                'status' => 'creating_custom_hostname',
            ])->save();

            $this->customHostnames->createCustomHostname($tenantDomain);

            $dnsRecords = [];
            if ($this->dns->enabled()) {
                $dnsRecords = $this->dns->ensureVanityRecords(
                    $domainName,
                    $domainName,
                    (string) $this->customHostnames->managedCnameTarget(),
                    config('services.cloudflare_saas.dcv_target')
                );
            }

            $order->forceFill([
                'status' => 'verifying',
                'verification_attempts' => 0,
                'last_checked_at' => now(),
                'next_check_at' => now()->addMinutes(5),
                'manual_state' => 'auto_verifying',
                'metadata' => array_merge($order->metadata ?? [], [
                    'dns_records' => $dnsRecords,
                    'provisioning_mode' => $this->dns->enabled() ? 'cloudflare_managed' : 'manual_dns',
                ]),
            ])->save();

            $this->customHostnames->refreshStatus($tenantDomain);

            $status = in_array($tenantDomain->fresh()->cf_status, ['active', 'pending_deployment'], true)
                ? 'active'
                : 'awaiting_dns';

            $order->forceFill([
                'status' => $status,
                'completed_at' => $status === 'active' ? now() : null,
                'next_check_at' => $status === 'active' ? null : now()->addMinutes(5),
            ])->save();

            if ($status !== 'active') {
                $this->scheduleAutoSync($order);
            }
        } catch (\Throwable $e) {
            $order->forceFill([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'last_checked_at' => now(),
                'next_check_at' => null,
                'metadata' => array_merge($order->metadata ?? [], [
                    'failed_at_stage' => $order->status,
                ]),
            ])->save();

            throw $e;
        }

        return $order->fresh();
    }

    public function connectExistingDomain(Tenant $tenant, string $domainName): DomainOrder
    {
        $this->assertCustomDomainEnabled($tenant);

        $domainName = $this->normalizeDomain($domainName);

        $order = DomainOrder::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'domain_name' => $domainName,
                'type' => 'connect',
            ],
            [
                'provider' => 'external',
                'status' => 'creating_custom_hostname',
                'error_message' => null,
                'notes' => null,
                'verification_attempts' => 0,
                'last_checked_at' => null,
                'next_check_at' => null,
                'manual_state' => null,
                'metadata' => ['flow' => 'connect'],
            ]
        );

        try {
            $tenantDomain = $this->ensureTenantCustomHostname($tenant, $domainName, 'tenant-domain-connect');

            $order->forceFill([
                'tenant_domain_id' => $tenantDomain->id,
            ])->save();

            if (! $tenantDomain->cf_custom_hostname_id) {
                $this->customHostnames->createCustomHostname($tenantDomain);
            }

            $order->forceFill([
                'status' => 'awaiting_dns',
                'last_checked_at' => now(),
                'next_check_at' => now()->addMinutes(5),
                'manual_state' => 'awaiting_customer_dns',
                'metadata' => array_merge($order->metadata ?? [], [
                    'instructions' => $this->customHostnames->dnsInstructions($tenantDomain->fresh()),
                ]),
            ])->save();

            $this->scheduleAutoSync($order);
        } catch (\Throwable $e) {
            $order->forceFill([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'last_checked_at' => now(),
                'next_check_at' => null,
            ])->save();

            throw $e;
        }

        return $order->fresh();
    }

    public function provisionExistingTenantDomain(Tenant $tenant, TenantDomain $tenantDomain): DomainOrder
    {
        $this->assertCustomDomainEnabled($tenant);

        if ((int) $tenantDomain->tenant_id !== (int) $tenant->id || $tenantDomain->type !== 'custom') {
            throw new RuntimeException('Ese dominio no pertenece al tenant o no es un dominio propio.');
        }

        $order = DomainOrder::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'domain_name' => $tenantDomain->hostname,
                'type' => 'connect',
            ],
            [
                'tenant_domain_id' => $tenantDomain->id,
                'provider' => $this->dns->enabled() ? 'cloudflare' : 'external',
                'status' => 'creating_custom_hostname',
                'error_message' => null,
                'verification_attempts' => 0,
                'last_checked_at' => null,
                'next_check_at' => null,
                'manual_state' => 'manual_retry_requested',
                'metadata' => ['flow' => 'connect_existing_tenant_domain'],
            ]
        );

        try {
            $this->customHostnames->refreshStatus($tenantDomain);

            $freshDomain = $tenantDomain->fresh();
            $instructions = $this->customHostnames->dnsInstructions($freshDomain);
            $dnsRecords = [];

            if ($this->dns->enabled()) {
                $dnsRecords = $this->dns->ensureVanityRecords(
                    $this->zoneNameForHostname($freshDomain->hostname),
                    $freshDomain->hostname,
                    (string) $this->customHostnames->managedCnameTarget(),
                    config('services.cloudflare_saas.dcv_target'),
                    $instructions['txt'] ?? null
                );
            }

            $this->customHostnames->refreshStatus($freshDomain);
            $freshDomain = $freshDomain->fresh();
            $status = in_array($freshDomain->cf_status, ['active', 'pending_deployment'], true)
                ? 'active'
                : ($this->dns->enabled() ? 'verifying' : 'awaiting_dns');

            $order->forceFill([
                'tenant_domain_id' => $freshDomain->id,
                'provider' => $this->dns->enabled() ? 'cloudflare' : 'external',
                'status' => $status,
                'completed_at' => $status === 'active' ? now() : null,
                'error_message' => null,
                'last_checked_at' => now(),
                'next_check_at' => $status === 'active' ? null : now()->addMinutes(5),
                'manual_state' => $status === 'active' ? 'active' : ($this->dns->enabled() ? 'auto_verifying' : 'awaiting_customer_dns'),
                'metadata' => array_merge($order->metadata ?? [], [
                    'instructions' => $this->customHostnames->dnsInstructions($freshDomain),
                    'dns_records' => $dnsRecords,
                    'provisioning_mode' => $this->dns->enabled() ? 'cloudflare_managed_dns' : 'manual_dns',
                ]),
            ])->save();

            if ($status !== 'active') {
                $this->scheduleAutoSync($order);
            }

            return $order->fresh();
        } catch (\Throwable $e) {
            $order->forceFill([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'last_checked_at' => now(),
                'next_check_at' => null,
            ])->save();

            throw $e;
        }
    }

    public function syncOrderStatus(DomainOrder $order): DomainOrder
    {
        if (! $order->tenantDomain) {
            throw new RuntimeException('Este pedido aun no tiene un dominio asociado.');
        }

        $domain = $order->tenantDomain;
        $this->customHostnames->refreshStatus($domain);

        $status = in_array($domain->fresh()->cf_status, ['active', 'pending_deployment'], true)
            ? 'active'
            : 'awaiting_dns';

        $order->forceFill([
            'status' => $status,
            'completed_at' => $status === 'active' ? now() : null,
            'error_message' => null,
            'verification_attempts' => (int) $order->verification_attempts + 1,
            'last_checked_at' => now(),
            'next_check_at' => $status === 'active' ? null : now()->addMinutes(5),
            'manual_state' => $status === 'active' ? 'active' : ($order->manual_state ?: 'auto_verifying'),
            'metadata' => array_merge($order->metadata ?? [], [
                'instructions' => $this->customHostnames->dnsInstructions($domain->fresh()),
            ]),
        ])->save();

        return $order->fresh();
    }

    public function markDnsConfigured(DomainOrder $order, ?string $note = null): DomainOrder
    {
        $this->ensureMutable($order);

        $order->forceFill([
            'status' => 'verifying',
            'manual_state' => 'dns_configured_by_customer',
            'notes' => $this->appendNote($order->notes, $note ?: 'Cliente indico que ya configuro el DNS.'),
            'error_message' => null,
            'next_check_at' => now()->addMinute(),
        ])->save();

        $this->scheduleAutoSync($order, 1);

        return $order->fresh();
    }

    public function retryOrder(DomainOrder $order, ?string $note = null): DomainOrder
    {
        $this->ensureMutable($order);

        if (! $order->tenantDomain && ! in_array($order->type, ['purchase', 'connect'], true)) {
            throw new RuntimeException('Este pedido no puede reintentarse.');
        }

        if (! $order->tenantDomain && $order->tenant) {
            $tenant = $order->tenant()->withoutGlobalScope('tenant')->first();

            if (! $tenant) {
                throw new RuntimeException('No se encontro el tenant de este pedido.');
            }

            return $order->type === 'purchase'
                ? $this->purchaseAndProvision($tenant, $order->domain_name)
                : $this->connectExistingDomain($tenant, $order->domain_name);
        }

        $order->forceFill([
            'status' => $order->tenantDomain ? 'verifying' : 'registering',
            'manual_state' => 'manual_retry_requested',
            'error_message' => null,
            'notes' => $this->appendNote($order->notes, $note ?: 'Soporte solicito reintento manual.'),
            'next_check_at' => now()->addMinute(),
        ])->save();

        if ($order->tenantDomain) {
            $this->scheduleAutoSync($order, 1);
        }

        return $order->fresh();
    }

    public function cancelOrder(DomainOrder $order, ?string $note = null): DomainOrder
    {
        if ($order->status === 'active') {
            throw new RuntimeException('Un pedido activo no puede cancelarse desde este flujo.');
        }

        $order->forceFill([
            'status' => 'cancelled',
            'manual_state' => 'cancelled_manually',
            'notes' => $this->appendNote($order->notes, $note ?: 'Pedido cancelado manualmente.'),
            'next_check_at' => null,
            'error_message' => null,
        ])->save();

        return $order->fresh();
    }

    public function addNote(DomainOrder $order, string $note): DomainOrder
    {
        $order->forceFill([
            'notes' => $this->appendNote($order->notes, $note),
        ])->save();

        return $order->fresh();
    }

    public function overrideStatus(DomainOrder $order, string $status, ?string $note = null): DomainOrder
    {
        if (! in_array($status, ['awaiting_dns', 'verifying', 'active', 'failed', 'cancelled'], true)) {
            throw new RuntimeException('Estado manual no permitido.');
        }

        $order->forceFill([
            'status' => $status,
            'manual_state' => 'manual_override',
            'notes' => $this->appendNote($order->notes, $note ?: "Estado forzado a {$status}."),
            'completed_at' => $status === 'active' ? now() : $order->completed_at,
            'next_check_at' => in_array($status, ['verifying', 'awaiting_dns'], true) ? now()->addMinutes(5) : null,
            'error_message' => $status === 'failed' ? ($order->error_message ?: 'Marcado manualmente como fallido.') : null,
        ])->save();

        if (in_array($status, ['verifying', 'awaiting_dns'], true)) {
            $this->scheduleAutoSync($order);
        }

        return $order->fresh();
    }

    protected function ensureTenantCustomHostname(Tenant $tenant, string $domainName, string $source): TenantDomain
    {
        $tenantDomain = TenantDomain::withoutGlobalScopes()
            ->firstOrCreate(
                ['hostname' => $domainName],
                [
                    'tenant_id' => $tenant->id,
                    'type' => 'custom',
                    'is_primary' => false,
                    'cf_status' => 'pending',
                    'metadata' => ['created_via' => $source],
                ]
            );

        if ((int) $tenantDomain->tenant_id !== (int) $tenant->id) {
            throw new RuntimeException('Ese dominio ya esta asociado a otra cuenta.');
        }

        $tenant->forceFill(['custom_domain' => $domainName])->save();

        return $tenantDomain;
    }

    protected function assertCustomDomainEnabled(Tenant $tenant): void
    {
        if (! $tenant->featureLimit('custom_domain')) {
            throw new RuntimeException('Tu plan actual no incluye dominio propio.');
        }
    }

    protected function normalizeDomain(string $domainName): string
    {
        $domainName = Str::lower(trim($domainName));
        $domainName = preg_replace('#^https?://#', '', $domainName) ?: $domainName;
        $domainName = trim($domainName, '/');

        return $domainName;
    }

    protected function zoneNameForHostname(string $hostname): string
    {
        $parts = explode('.', strtolower(trim($hostname, '.')));

        if (count($parts) <= 2) {
            return implode('.', $parts);
        }

        return implode('.', array_slice($parts, -2));
    }

    protected function scheduleAutoSync(DomainOrder $order, int $minutes = 5): void
    {
        SyncDomainProvisioningJob::dispatch($order->id)->delay(now()->addMinutes($minutes));
    }

    protected function appendNote(?string $existing, string $note): string
    {
        $note = trim($note);
        $prefix = '['.now()->format('Y-m-d H:i').'] ';

        if ($note === '') {
            return (string) $existing;
        }

        return trim(($existing ? rtrim($existing).PHP_EOL : '').$prefix.$note);
    }

    protected function ensureMutable(DomainOrder $order): void
    {
        if (in_array($order->status, ['active', 'cancelled'], true)) {
            throw new RuntimeException('Este pedido ya no acepta cambios manuales desde este flujo.');
        }
    }
}
