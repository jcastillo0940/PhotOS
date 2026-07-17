<?php

namespace App\Models\Concerns;

use App\Models\Tenant;
use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

trait BelongsToTenant
{
    protected static array $tenantColumnCache = [];

    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            $model = $builder->getModel();

            if (!static::usesTenantColumn($model->getTable())) {
                return;
            }

            $tenantId = app(TenantContext::class)->id();

            if ($tenantId !== null) {
                $builder->where($model->qualifyColumn('tenant_id'), $tenantId);
                return;
            }

            // En un proceso CLI (comando/job) el scope se omite: pueden operar cross-tenant
            // usando withoutGlobalScope('tenant') + filtro explícito de tenant_id.
            // En un request HTTP sin tenant resuelto el scope devuelve cero filas para
            // evitar que datos de otro tenant sean visibles por error de configuración.
            if (!app()->runningInConsole()) {
                $builder->whereRaw('0 = 1');
            }
        });

        static::creating(function ($model) {
            if (!static::usesTenantColumn($model->getTable())) {
                return;
            }

            if (!blank($model->tenant_id)) {
                return;
            }

            $tenantId = app(TenantContext::class)->id();

            if ($tenantId) {
                $model->tenant_id = $tenantId;
            }
        });
    }

    protected static function usesTenantColumn(string $table): bool
    {
        if (!array_key_exists($table, static::$tenantColumnCache)) {
            static::$tenantColumnCache[$table] = Schema::hasTable($table) && Schema::hasColumn($table, 'tenant_id');
        }

        return static::$tenantColumnCache[$table];
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
