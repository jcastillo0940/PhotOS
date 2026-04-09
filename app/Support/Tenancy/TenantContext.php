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
}
