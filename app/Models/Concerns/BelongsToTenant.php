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

            if ($tenantId) {
                $builder->where($model->qualifyColumn('tenant_id'), $tenantId);
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
