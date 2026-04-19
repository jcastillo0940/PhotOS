<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\User;
use App\Support\TenantBrandPreset;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SeedMisaelDavidTenant extends Command
{
    protected $signature = 'saas:seed-misaeldavid
        {--replace : Reemplaza los datos actuales del tenant y dominio si ya existen}';

    protected $description = 'Recrea el tenant demo de Misael David con su dominio SaaS ya validado.';

    public function handle(): int
    {
        $tenantPayload = [
            'name' => 'Misael David Demo',
            'slug' => 'misaeldavid-demo',
            'status' => 'active',
            'plan_code' => 'business',
            'billing_email' => 'admin@misaeldavid.com',
            'storage_limit_bytes' => 0,
            'ai_enabled' => true,
            'custom_domain_enabled' => true,
            'metadata' => [
                'created_via' => 'artisan-seeder',
                'source' => 'local-demo',
            ],
        ];

        $domainPayload = [
            'hostname' => 'misaeldavid.com',
            'type' => 'custom',
            'is_primary' => false,
            'cf_custom_hostname_id' => 'f3500d4b-abc8-4b57-a6a8-90755de9d69d',
            'cf_status' => 'active',
            'verification_method' => 'txt',
            'verified_at' => '2026-04-09 22:23:04',
            'metadata' => [
                'created_via' => 'artisan-seeder',
                'source' => 'local-demo',
                'ssl_validation' => [
                    'method' => 'txt',
                    'status' => 'active',
                    'txt_name' => null,
                    'txt_value' => null,
                ],
                'ownership_verification' => [
                    'name' => null,
                    'type' => 'txt',
                    'value' => null,
                ],
                'raw_cloudflare' => [
                    'id' => 'f3500d4b-abc8-4b57-a6a8-90755de9d69d',
                    'status' => 'active',
                    'hostname' => 'misaeldavid.com',
                    'created_at' => '2026-04-09T22:10:06.474973Z',
                    'ssl' => [
                        'id' => 'a0e4668e-3a52-41a1-b62a-f86b0b7940de',
                        'type' => 'dv',
                        'hosts' => ['misaeldavid.com'],
                        'method' => 'txt',
                        'status' => 'active',
                        'settings' => [],
                        'wildcard' => false,
                        'bundle_method' => 'ubiquitous',
                        'certificate_authority' => 'google',
                        'certificates' => [
                            [
                                'id' => '73ca87fe-b72f-4dca-961c-692d1e9873a3',
                                'issuer' => 'GoogleTrustServices',
                                'issued_on' => '2026-04-09T21:19:03Z',
                                'signature' => 'SHA256WithRSA',
                                'expires_on' => '2026-07-08T22:10:09Z',
                                'serial_number' => '52207019117211711095343685800433377676',
                                'fingerprint_sha256' => 'ec146c6f5a62f094ddc81e47c6064c2d68b4336ee514a9488d12db2a4ad5b5af',
                            ],
                            [
                                'id' => 'de91a2e7-91f6-49f1-9dc0-e93d2f6eb3ec',
                                'issuer' => 'GoogleTrustServices',
                                'issued_on' => '2026-04-09T21:19:18Z',
                                'signature' => 'ECDSAWithSHA256',
                                'expires_on' => '2026-07-08T22:19:09Z',
                                'serial_number' => '58402539346124694178953111104079838788',
                                'fingerprint_sha256' => '351221e6303f87fe33dd3cf9fe87539e59b11d1a4d359643bd1afc5e81dd849f',
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $replace = (bool) $this->option('replace');

        $tenant = Tenant::query()->where('slug', $tenantPayload['slug'])->first();

        if ($tenant && !$replace) {
            $this->warn('El tenant misaeldavid-demo ya existe. Usa --replace si quieres actualizarlo.');

            return self::SUCCESS;
        }

        if ($tenant && $replace) {
            $tenant->update($tenantPayload);
        } else {
            $tenant = Tenant::create($tenantPayload);
        }

        $domain = TenantDomain::query()->where('hostname', $domainPayload['hostname'])->first();

        if ($domain && $domain->tenant_id !== $tenant->id && !$replace) {
            $this->error('El dominio misaeldavid.com ya existe asociado a otro tenant. Usa --replace solo si estas seguro.');

            return self::FAILURE;
        }

        if ($domain && $replace) {
            $domain->update(array_merge($domainPayload, [
                'tenant_id' => $tenant->id,
            ]));
        } elseif (!$domain) {
            $domain = TenantDomain::create(array_merge($domainPayload, [
                'tenant_id' => $tenant->id,
            ]));
        }

        User::updateOrCreate(
            ['email' => 'admin@misaeldavid.com'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Misael David',
                'password' => Hash::make('misael2026'),
                'role' => 'photographer',
                'email_verified_at' => now(),
            ]
        );

        TenantBrandPreset::apply($tenant, 'editorial-warm');

        $this->info('Tenant de Misael David listo en esta instancia.');
        $this->line('Tenant: '.$tenant->name.' ['.$tenant->slug.']');
        $this->line('Dominio: '.$domain->hostname);
        $this->line('Login: admin@misaeldavid.com / misael2026');
        $this->line('Cloudflare ID: '.$domain->cf_custom_hostname_id);
        $this->line('Estado: '.$domain->cf_status);

        return self::SUCCESS;
    }
}
