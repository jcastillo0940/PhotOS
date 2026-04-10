<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users') || !Schema::hasTable('tenants') || !Schema::hasColumn('users', 'tenant_id')) {
            return;
        }

        $tenantId = DB::table('tenants')->orderBy('id')->value('id');

        if ($tenantId) {
            DB::table('users')->whereNull('tenant_id')->update(['tenant_id' => $tenantId]);
        }

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            try {
                $table->dropUnique('users_email_unique');
            } catch (\Throwable $e) {
                // Ignore if the old unique index does not exist.
            }
        });

        Schema::table('users', function (Blueprint $table) {
            try {
                $table->unique(['tenant_id', 'email'], 'users_tenant_id_email_unique');
            } catch (\Throwable $e) {
                // Ignore if the composite unique index already exists.
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('users') || DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            try {
                $table->dropUnique('users_tenant_id_email_unique');
            } catch (\Throwable $e) {
                // Ignore when rolling back on a database that never had this index.
            }
        });

        Schema::table('users', function (Blueprint $table) {
            try {
                $table->unique('email', 'users_email_unique');
            } catch (\Throwable $e) {
                // Ignore if the original index cannot be restored automatically.
            }
        });
    }
};
