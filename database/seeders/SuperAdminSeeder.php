<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

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
                'password' => Hash::make('admin2026'),
                'role' => 'developer',
                'email_verified_at' => now(),
            ]
        );
    }
}
