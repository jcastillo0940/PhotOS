<?php

namespace App\Support\Tenancy;

use App\Models\Tenant;

class TenantContext
{
    public function __construct(
        protected ?Tenant $tenant = null,
        protected ?string $hostname = null,
    ) {
    }

    public function set(?Tenant $tenant, ?string $hostname = null): void
    {
        $this->tenant = $tenant;
        $this->hostname = $hostname;
    }

    public function tenant(): ?Tenant
    {
        return $this->tenant;
    }

    public function id(): ?int
    {
        return $this->tenant?->id;
    }

    public function hostname(): ?string
    {
        return $this->hostname;
    }

    public function hasTenant(): bool
    {
        return $this->tenant !== null;
    }

    /**
     * Lanza 404 si no hay tenant resuelto para este request.
     * Usar en controllers que NUNCA deben ejecutarse sin contexto de tenant.
     */
    public function assertHasTenant(): void
    {
        if ($this->tenant === null) {
            abort(404, 'No se encontro un estudio asociado a este dominio.');
        }
    }
}
