<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected array $tables = [
        'users',
        'settings',
        'clients',
        'leads',
        'projects',
        'contracts',
        'invoices',
        'events',
        'photos',
        'purchases',
        'download_logs',
        'payments',
        'account_statements',
        'automation_rules',
        'automation_runs',
        'crm_tasks',
        'face_identities',
        'gallery_email_registrations',
        'gallery_favorites',
        'gallery_favorite_logs',
    ];

    public function up(): void
    {
        $tenantId = DB::table('tenants')->orderBy('id')->value('id');

        foreach ($this->tables as $table) {
            if (!Schema::hasTable($table) || Schema::hasColumn($table, 'tenant_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreignId('tenant_id')->nullable()->after('id')->constrained('tenants')->nullOnDelete();
                $blueprint->index('tenant_id');
            });

            if ($tenantId) {
                DB::table($table)->update(['tenant_id' => $tenantId]);
            }
        }

        Schema::table('settings', function (Blueprint $blueprint) {
            $blueprint->dropUnique(['key']);
        });

        Schema::table('settings', function (Blueprint $blueprint) {
            $blueprint->unique(['tenant_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $blueprint) {
            $blueprint->dropUnique(['tenant_id', 'key']);
            $blueprint->unique('key');
        });

        foreach (array_reverse($this->tables) as $table) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'tenant_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropConstrainedForeignId('tenant_id');
            });
        }
    }
};
