<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('status')->default('active');
            $table->string('plan_code')->default('starter');
            $table->string('billing_email')->nullable();
            $table->unsignedBigInteger('storage_limit_bytes')->default(0);
            $table->boolean('ai_enabled')->default(false);
            $table->boolean('custom_domain_enabled')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('tenant_domains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('hostname')->unique();
            $table->string('type')->default('subdomain');
            $table->boolean('is_primary')->default(false);
            $table->string('cf_custom_hostname_id')->nullable();
            $table->string('cf_status')->nullable();
            $table->string('verification_method')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        $appUrlHost = parse_url((string) config('app.url'), PHP_URL_HOST) ?: 'localhost';
        $appName = trim((string) config('app.name', 'PhotOS'));
        $slug = Str::slug($appName) ?: 'photos-demo';

        $tenantId = DB::table('tenants')->insertGetId([
            'name' => $appName,
            'slug' => $slug,
            'status' => 'active',
            'plan_code' => 'studio',
            'billing_email' => null,
            'storage_limit_bytes' => 0,
            'ai_enabled' => true,
            'custom_domain_enabled' => true,
            'metadata' => json_encode([
                'seeded_by_migration' => true,
                'mode' => 'legacy-installation',
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_domains')->insert([
            'tenant_id' => $tenantId,
            'hostname' => $appUrlHost,
            'type' => 'primary',
            'is_primary' => true,
            'verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($appUrlHost !== 'localhost') {
            DB::table('tenant_domains')->insertOrIgnore([
                'tenant_id' => $tenantId,
                'hostname' => 'localhost',
                'type' => 'development',
                'is_primary' => false,
                'verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_domains');
        Schema::dropIfExists('tenants');
    }
};
