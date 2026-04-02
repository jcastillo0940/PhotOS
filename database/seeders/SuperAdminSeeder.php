<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@photos.com'],
            [
                'name' => 'Studio Superadmin',
                'password' => Hash::make('admin2026'),
            ]
        );
    }
}
