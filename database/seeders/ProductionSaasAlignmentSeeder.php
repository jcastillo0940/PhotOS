<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ProductionSaasAlignmentSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SaasConfigurationSeeder::class,
        ]);
    }
}
