<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Proyectos con los viejos valores por defecto de plan heredan ahora del plan directamente.
        // Essential tenía 1, Pro Studio tenía 6. Al poner null heredan los nuevos límites del config.
        DB::table('projects')
            ->whereIn('weekly_download_limit', [1, 6])
            ->update(['weekly_download_limit' => null]);
    }

    public function down(): void
    {
        // No reversible — los límites anteriores eran incorrectamente bajos.
    }
};
