<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = ['key', 'value', 'group', 'is_secret'];

    protected $casts = [
        'is_secret' => 'boolean',
    ];

    public static function get($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    public static function set($key, $value, $group = 'general', $isSecret = false)
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'group' => $group, 'is_secret' => $isSecret]
        );
    }
}
