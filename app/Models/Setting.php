<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = ['tenant_id', 'key', 'value', 'group', 'is_secret'];

    protected $casts = [
        'is_secret' => 'boolean',
    ];

    public static function get($key, $default = null)
    {
        $tenantId = app(TenantContext::class)->id();

        $query = self::query()->where('key', $key);

        if ($tenantId) {
            $setting = (clone $query)
                ->withoutGlobalScope('tenant')
                ->where('tenant_id', $tenantId)
                ->first();

            if ($setting) {
                return $setting->value;
            }
        }

        $setting = $query
            ->withoutGlobalScope('tenant')
            ->whereNull('tenant_id')
            ->first();

        return $setting ? $setting->value : $default;
    }

    public static function set($key, $value, $group = 'general', $isSecret = false)
    {
        return self::withoutGlobalScope('tenant')->updateOrCreate(
            [
                'tenant_id' => app(TenantContext::class)->id(),
                'key' => $key,
            ],
            ['value' => $value, 'group' => $group, 'is_secret' => $isSecret]
        );
    }
}
