<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $defaultTenantId = Tenant::query()->orderBy('id')->value('id');

        User::updateOrCreate(
            ['email' => 'admin@photos.com'],
            [
                'tenant_id' => $defaultTenantId,
                'name' => 'Studio Superadmin',
                'password' => Hash::make($this->seedPassword('SEED_SUPERADMIN_PASSWORD')),
                'role' => 'developer',
                'email_verified_at' => now(),
            ]
        );
    }

    private function seedPassword(string $envKey): string
    {
        return env($envKey) ?: Str::random(32);
    }
}
