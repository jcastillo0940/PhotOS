<?php

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\DownloadLog;
use App\Models\Event;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Photo;
use App\Models\Project;
use App\Models\Purchase;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use App\Support\DemoMediaSeeder;
use App\Support\ContractTemplate;
use App\Support\GalleryTemplate;
use App\Support\HomepageSettings;
use App\Support\InstallationPlan;
use App\Support\TenantBrandPreset;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSystemSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $this->resetDemoData();
            $defaultTenantId = Tenant::query()->orderBy('id')->value('id');

            $platformOwner = User::updateOrCreate(
                ['email' => 'owner@photos.com'],
                [
                    'tenant_id' => $defaultTenantId,
                    'name' => 'PhotOS Owner',
                    'password' => Hash::make($this->seedPassword('SEED_OWNER_PASSWORD')),
                    'role' => 'owner',
                    'email_verified_at' => now(),
                ]
            );

            $developer = User::updateOrCreate(
                ['email' => 'developer@photos.com'],
                [
                    'tenant_id' => $defaultTenantId,
                    'name' => 'PhotOS Developer',
                    'password' => Hash::make($this->seedPassword('SEED_DEVELOPER_PASSWORD')),
                    'role' => 'developer',
                    'email_verified_at' => now(),
                ]
            );

            $photographer = User::updateOrCreate(
                ['email' => 'studio@mono.com'],
                [
                    'tenant_id' => $defaultTenantId,
                    'name' => 'Mono Studio',
                    'password' => Hash::make($this->seedPassword('SEED_PHOTOGRAPHER_PASSWORD')),
                    'role' => 'photographer',
                    'email_verified_at' => now(),
                ]
            );

            $this->seedSettings();
            $this->seedHomepage();

            $leadNew = Lead::create([
                'name' => 'Elena Vargas',
                'email' => 'elena.vargas@example.com',
                'event_type' => 'Wedding',
                'tentative_date' => now()->addWeeks(10)->toDateString(),
                'responses' => [
                    'phone' => '+506 7011 1122',
                    'message' => 'Buscamos una boda intima en la playa con retratos editoriales al atardecer.',
                ],
                'notes' => 'Prioridad alta. Quiere videollamada esta semana.',
                'status' => 'lead',
                'last_active_at' => now()->subHours(3),
            ]);

            $leadQualified = Lead::create([
                'name' => 'North Peak Outdoors',
                'email' => 'marketing@northpeak.test',
                'event_type' => 'Commercial',
                'tentative_date' => now()->addWeeks(4)->toDateString(),
                'responses' => [
                    'phone' => '+1 555 410 8821',
                    'message' => 'Necesitamos una produccion lifestyle para nueva campana de ropa outdoor.',
                ],
                'notes' => 'Lead ya calificado. Esperando propuesta economica.',
                'status' => 'qualified',
                'last_active_at' => now()->subDay(),
            ]);

            $leadProjectSigned = Lead::create([
                'name' => 'Camila & Diego',
                'email' => 'camila.diego@example.com',
                'event_type' => 'Wedding',
                'tentative_date' => now()->addWeeks(6)->toDateString(),
                'responses' => [
                    'phone' => '+506 6200 1100',
                    'message' => 'Queremos fotos naturales, elegantes y un portal privado para compartir con la familia.',
                ],
                'notes' => 'Cliente ideal para demo de contrato y galeria.',
                'status' => 'project',
                'last_active_at' => now(),
            ]);

            $leadProjectPending = Lead::create([
                'name' => 'Lucia Marin',
                'email' => 'lucia.marin@example.com',
                'event_type' => 'Portrait',
                'tentative_date' => now()->addWeeks(2)->toDateString(),
                'responses' => [
                    'phone' => '+506 6100 2244',
                    'message' => 'Sesion editorial en estudio para marca personal.',
                ],
                'notes' => 'Contrato creado, falta firma y pago de reserva.',
                'status' => 'project',
                'last_active_at' => now()->subHours(12),
            ]);

            $leadLost = Lead::create([
                'name' => 'Marco Rojas',
                'email' => 'marco.rojas@example.com',
                'event_type' => 'Event',
                'tentative_date' => now()->subWeeks(1)->toDateString(),
                'responses' => [
                    'phone' => '+506 6222 8899',
                    'message' => 'Pidio cotizacion para cobertura corporativa, pero eligio otro proveedor.',
                ],
                'notes' => 'Cerrar con follow-up de portafolio corporativo a futuro.',
                'status' => 'lost',
                'last_active_at' => now()->subDays(8),
            ]);

            $signedProject = Project::create([
                'lead_id' => $leadProjectSigned->id,
                'owner_user_id' => $photographer->id,
                'name' => 'Camila & Diego - Reserva Premium',
                'status' => 'active',
                'event_date' => now()->addWeeks(6)->toDateString(),
                'location' => 'Hacienda Los Cipreses',
                'package_details' => [
                    'package' => 'Full wedding story',
                    'hours' => 10,
                    'deliverables' => ['Galeria web', 'Originales', 'Mini album teaser'],
                ],
                'roadmap' => [
                    'timeline' => ['Ceremonia 3:00 PM', 'Golden hour 5:45 PM', 'Recepcion 7:00 PM'],
                    'contacts' => ['Planner: Sofia +506 8888 1111', 'Venue: Hacienda Los Cipreses'],
                ],
                'gallery_token' => $this->seedToken('SEED_GALLERY_TOKEN_SIGNED'),
                'gallery_password' => null,
                'download_limit' => 6,
                'weekly_download_limit' => 6,
                'downloads_used_in_window' => 2,
                'downloads_window_started_at' => now()->subDays(2),
                'extra_download_quota' => 2,
                'retention_days' => 90,
                'storage_limit_bytes' => 10 * 1024 * 1024 * 1024,
                'is_full_gallery_purchased' => true,
                'full_gallery_price' => 299.00,
                'originals_expires_at' => now()->addDays(75),
                'gallery_template_code' => 'editorial-frame',
            ]);

            $pendingProject = Project::create([
                'lead_id' => $leadProjectPending->id,
                'owner_user_id' => $photographer->id,
                'name' => 'Lucia Marin - Brand Portraits',
                'status' => 'pending_payment',
                'event_date' => now()->addWeeks(2)->toDateString(),
                'location' => 'San Jose Studio Loft',
                'package_details' => [
                    'package' => 'Personal branding portrait day',
                    'hours' => 4,
                    'deliverables' => ['Galeria web', '20 selects retocadas'],
                ],
                'roadmap' => [
                    'timeline' => ['Call sheet 8:00 AM', 'Shoot 9:00 AM', 'Review 2:00 PM'],
                    'contacts' => ['Makeup: Ana +506 7777 1212'],
                ],
                'gallery_token' => $this->seedToken('SEED_GALLERY_TOKEN_PENDING'),
                'gallery_password' => null,
                'download_limit' => 6,
                'weekly_download_limit' => 6,
                'downloads_used_in_window' => 0,
                'downloads_window_started_at' => now(),
                'extra_download_quota' => 0,
                'retention_days' => 90,
                'storage_limit_bytes' => 10 * 1024 * 1024 * 1024,
                'is_full_gallery_purchased' => false,
                'full_gallery_price' => 149.00,
                'originals_expires_at' => now()->addDays(90),
                'gallery_template_code' => 'split-story',
            ]);

            $deliveredLead = Lead::create([
                'name' => 'Atelier Verde',
                'email' => 'hello@atelierverde.test',
                'event_type' => 'Commercial',
                'tentative_date' => now()->subWeeks(3)->toDateString(),
                'responses' => [
                    'phone' => '+1 555 998 2211',
                    'message' => 'Campana finalizada, cliente satisfecho. Ideal para probar vistas de proyecto entregado.',
                ],
                'notes' => 'Caso de estudio comercial entregado.',
                'status' => 'project',
                'last_active_at' => now()->subDays(4),
            ]);

            $deliveredProject = Project::create([
                'lead_id' => $deliveredLead->id,
                'owner_user_id' => $platformOwner->id,
                'name' => 'Atelier Verde - SS26 Campaign',
                'status' => 'delivered',
                'event_date' => now()->subWeeks(3)->toDateString(),
                'location' => 'Santa Teresa',
                'package_details' => [
                    'package' => 'Campaign production',
                    'hours' => 8,
                    'deliverables' => ['Galeria web', 'Originales', 'Lookbook selects'],
                ],
                'roadmap' => [
                    'timeline' => ['Shoot complete', 'Selections approved', 'Final delivery done'],
                    'contacts' => ['Creative director: Nora'],
                ],
                'gallery_token' => $this->seedToken('SEED_GALLERY_TOKEN_DELIVERED'),
                'gallery_password' => null,
                'download_limit' => 6,
                'weekly_download_limit' => 6,
                'downloads_used_in_window' => 1,
                'downloads_window_started_at' => now()->subDays(1),
                'extra_download_quota' => 0,
                'retention_days' => 90,
                'storage_limit_bytes' => 10 * 1024 * 1024 * 1024,
                'is_full_gallery_purchased' => true,
                'full_gallery_price' => 0,
                'originals_expires_at' => now()->addDays(50),
                'gallery_template_code' => 'mono-story',
            ]);

            $this->seedContracts($signedProject, $pendingProject, $deliveredProject);
            $this->seedInvoices($signedProject, $pendingProject, $deliveredProject);
            $this->seedPurchases($signedProject, $deliveredProject);
            $this->seedEvents($signedProject, $pendingProject, $deliveredProject);
            $this->seedPhotos($signedProject, 'wedding');
            $this->seedPhotos($pendingProject, 'portrait');
            $this->seedPhotos($deliveredProject, 'commercial');

            $mediaSeeder = app(DemoMediaSeeder::class);

            if ($mediaSeeder->canWriteToR2()) {
                $mediaSeeder->syncHomepageImages();
                $mediaSeeder->syncProjectPhotos($signedProject->fresh(), 'wedding');
                $mediaSeeder->syncProjectPhotos($pendingProject->fresh(), 'portrait');
                $mediaSeeder->syncProjectPhotos($deliveredProject->fresh(), 'commercial');
            }
        });
    }

    private function resetDemoData(): void
    {
        DownloadLog::query()->delete();
        Purchase::query()->delete();
        Contract::query()->delete();
        Invoice::query()->delete();
        Event::query()->delete();
        Photo::query()->delete();
        Project::query()->delete();
        Lead::query()->delete();
            User::query()->whereIn('email', [
                'owner@photos.com',
                'developer@photos.com',
                'studio@mono.com',
                'admin@photos.com',
                'test@example.com',
        ])->delete();
    }

    private function seedSettings(): void
    {
        $settings = [
            ['key' => InstallationPlan::SETTING_KEY, 'value' => 'pro_studio', 'group' => 'installation', 'is_secret' => false, 'overwrite' => true],
            ['key' => GalleryTemplate::SETTING_KEY, 'value' => 'editorial-frame', 'group' => 'installation', 'is_secret' => false, 'overwrite' => true],
            ['key' => 'r2_key', 'value' => null, 'group' => 'storage', 'is_secret' => true, 'overwrite' => false],
            ['key' => 'r2_secret', 'value' => null, 'group' => 'storage', 'is_secret' => true, 'overwrite' => false],
            ['key' => 'r2_bucket', 'value' => null, 'group' => 'storage', 'is_secret' => false, 'overwrite' => false],
            ['key' => 'r2_endpoint', 'value' => null, 'group' => 'storage', 'is_secret' => false, 'overwrite' => false],
            ['key' => 'paypal_client_id', 'value' => null, 'group' => 'payment', 'is_secret' => true, 'overwrite' => false],
            ['key' => 'paypal_secret', 'value' => null, 'group' => 'payment', 'is_secret' => true, 'overwrite' => false],
            ['key' => 'tilopay_api_key', 'value' => null, 'group' => 'payment', 'is_secret' => true, 'overwrite' => false],
            ['key' => 'tilopay_secret_key', 'value' => null, 'group' => 'payment', 'is_secret' => true, 'overwrite' => false],
            ['key' => 'platform_watermark_label', 'value' => 'PhotOS Demo', 'group' => 'branding', 'is_secret' => false],
            ['key' => 'photographer_watermark_path', 'value' => null, 'group' => 'branding', 'is_secret' => false],
            ['key' => 'photographer_business_name', 'value' => 'MONO Studio', 'group' => 'legal', 'is_secret' => false],
            ['key' => 'photographer_document', 'value' => '8-123-456', 'group' => 'legal', 'is_secret' => false],
            ['key' => 'legal_city', 'value' => 'Panama City', 'group' => 'legal', 'is_secret' => false],
            ['key' => 'jurisdiction_country', 'value' => 'Panama', 'group' => 'legal', 'is_secret' => false],
            ['key' => 'default_privacy_fee', 'value' => '150', 'group' => 'legal', 'is_secret' => false],
        ];

        foreach ($settings as $setting) {
            $existing = Setting::where('key', $setting['key'])->first();

            if ($existing && $this->isDemoPlaceholder($existing->value)) {
                $existing->update(['value' => null]);
                $existing->refresh();
            }

            if ($existing && empty($setting['overwrite']) && filled($existing->value)) {
                continue;
            }

            Setting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'group' => $setting['group'],
                    'is_secret' => $setting['is_secret'],
                ]
            );
        }
    }

    private function isDemoPlaceholder(?string $value): bool
    {
        if (! filled($value)) {
            return false;
        }

        return str_contains($value, 'demo-account.r2.cloudflarestorage.com')
            || str_contains($value, 'photos-demo-bucket')
            || str_starts_with($value, 'demo-');
    }

    private function seedHomepage(): void
    {
        $homepage = HomepageSettings::defaults();

        $homepage['brand']['name'] = 'MONO Studio';
        $homepage['brand']['tagline'] = 'Soft moments, captured with heart.';
        $homepage['hero']['title'] = 'Real stories, natural settings, and portraiture shaped by light.';
        $homepage['hero']['description'] = 'A photographer website ready for demos, client approvals, and lead capture inside PhotOS.';
        $homepage['about']['heading'] = 'Modern photography for couples, brands, and stories that want atmosphere.';
        $homepage['contact']['info_lines'] = [
            'Demo studio based in Costa Rica',
            'Replies within one business day',
            'Admin login available from the footer',
        ];

        HomepageSettings::save($homepage);
        if ($tenantId = Tenant::query()->orderBy('id')->value('id')) {
            TenantBrandPreset::apply(Tenant::find($tenantId), 'editorial-warm');
        }
    }

    private function seedContracts(Project $signedProject, Project $pendingProject, Project $deliveredProject): void
    {
        Contract::create([
            'project_id' => $signedProject->id,
            'content' => ContractTemplate::defaultTemplateForEventType('wedding'),
            'status' => 'signed',
            'signed_at' => now()->subDays(8),
            'signature_data' => 'data:image/png;base64,'.base64_encode('signed-camila-diego'),
            'token' => $this->seedToken('SEED_CONTRACT_TOKEN_SIGNED'),
        ]);

        Contract::create([
            'project_id' => $pendingProject->id,
            'content' => ContractTemplate::defaultTemplateForEventType('portrait'),
            'status' => 'pending',
            'signed_at' => null,
            'signature_data' => null,
            'token' => $this->seedToken('SEED_CONTRACT_TOKEN_PENDING'),
        ]);

        Contract::create([
            'project_id' => $deliveredProject->id,
            'content' => ContractTemplate::defaultTemplateForEventType('commercial'),
            'status' => 'signed',
            'signed_at' => now()->subWeeks(4),
            'signature_data' => 'data:image/png;base64,'.base64_encode('signed-atelier-verde'),
            'token' => $this->seedToken('SEED_CONTRACT_TOKEN_DELIVERED'),
        ]);
    }

    private function seedPassword(string $envKey): string
    {
        return env($envKey) ?: Str::random(32);
    }

    private function seedToken(string $envKey): string
    {
        return env($envKey) ?: Str::lower(Str::random(40));
    }

    private function seedInvoices(Project $signedProject, Project $pendingProject, Project $deliveredProject): void
    {
        Invoice::create([
            'project_id' => $signedProject->id,
            'amount' => 650.00,
            'status' => 'paid',
            'due_date' => now()->subDays(12)->toDateString(),
            'concept' => 'Reservation fee',
            'notes' => 'Reserva inicial pagada.',
        ]);

        Invoice::create([
            'project_id' => $signedProject->id,
            'amount' => 1350.00,
            'status' => 'unpaid',
            'due_date' => now()->addWeeks(5)->toDateString(),
            'concept' => 'Final balance',
            'notes' => 'Pendiente de pago antes del evento.',
        ]);

        Invoice::create([
            'project_id' => $pendingProject->id,
            'amount' => 300.00,
            'status' => 'unpaid',
            'due_date' => now()->addDays(5)->toDateString(),
            'concept' => 'Reservation fee',
            'notes' => 'Esperando firma y confirmacion de agenda.',
        ]);

        Invoice::create([
            'project_id' => $deliveredProject->id,
            'amount' => 2400.00,
            'status' => 'paid',
            'due_date' => now()->subWeeks(5)->toDateString(),
            'concept' => 'Campaign production',
            'notes' => 'Proyecto liquidado al 100%.',
        ]);
    }

    private function seedPurchases(Project $signedProject, Project $deliveredProject): void
    {
        Purchase::create([
            'project_id' => $signedProject->id,
            'amount' => 299.00,
            'status' => 'completed',
            'gateway' => 'paypal',
            'type' => 'full_gallery',
            'payload' => ['transaction_id' => 'PAY-DEMO-001'],
        ]);

        Purchase::create([
            'project_id' => $signedProject->id,
            'amount' => 49.00,
            'status' => 'completed',
            'gateway' => 'tilopay',
            'type' => 'extra_pack',
            'payload' => ['transaction_id' => 'TILO-DEMO-002'],
        ]);

        Purchase::create([
            'project_id' => $deliveredProject->id,
            'amount' => 0.00,
            'status' => 'completed',
            'gateway' => 'paypal',
            'type' => 'full_gallery',
            'payload' => ['transaction_id' => 'PAY-DEMO-003'],
        ]);
    }

    private function seedEvents(Project $signedProject, Project $pendingProject, Project $deliveredProject): void
    {
        Event::create([
            'project_id' => $signedProject->id,
            'title' => 'Wedding day coverage',
            'description' => 'Cobertura principal de boda.',
            'start' => now()->addWeeks(6)->setTime(13, 0),
            'end' => now()->addWeeks(6)->setTime(22, 0),
            'type' => 'session',
            'color' => '#14b8a6',
            'all_day' => false,
        ]);

        Event::create([
            'project_id' => $pendingProject->id,
            'title' => 'Brand portrait session',
            'description' => 'Sesion de retrato para Lucia Marin.',
            'start' => now()->addWeeks(2)->setTime(9, 0),
            'end' => now()->addWeeks(2)->setTime(13, 0),
            'type' => 'tentative',
            'color' => '#f59e0b',
            'all_day' => false,
        ]);

        Event::create([
            'project_id' => null,
            'title' => 'Blocked: travel day',
            'description' => 'Bloqueo manual para traslados.',
            'start' => now()->addDays(10)->setTime(8, 0),
            'end' => now()->addDays(10)->setTime(18, 0),
            'type' => 'blocked',
            'color' => '#64748b',
            'all_day' => false,
        ]);

        Event::create([
            'project_id' => $deliveredProject->id,
            'title' => 'Final delivery review',
            'description' => 'Proyecto comercial cerrado.',
            'start' => now()->subWeeks(2)->setTime(15, 0),
            'end' => now()->subWeeks(2)->setTime(16, 0),
            'type' => 'session',
            'color' => '#10b981',
            'all_day' => false,
        ]);
    }

    private function seedPhotos(Project $project, string $theme): void
    {
        $themes = [
            'wedding' => [
                ['seed' => 'wedding-1', 'category' => 'Ceremony', 'tags' => ['ceremony', 'couple']],
                ['seed' => 'wedding-2', 'category' => 'Portraits', 'tags' => ['portrait', 'editorial']],
                ['seed' => 'wedding-3', 'category' => 'Details', 'tags' => ['details', 'rings']],
                ['seed' => 'wedding-4', 'category' => 'Reception', 'tags' => ['party', 'dance']],
                ['seed' => 'wedding-5', 'category' => 'Portraits', 'tags' => ['golden-hour', 'portrait']],
                ['seed' => 'wedding-6', 'category' => 'Candid', 'tags' => ['family', 'candid']],
            ],
            'portrait' => [
                ['seed' => 'portrait-1', 'category' => 'Studio', 'tags' => ['branding', 'studio']],
                ['seed' => 'portrait-2', 'category' => 'Lifestyle', 'tags' => ['movement', 'editorial']],
                ['seed' => 'portrait-3', 'category' => 'Details', 'tags' => ['workspace', 'branding']],
                ['seed' => 'portrait-4', 'category' => 'Studio', 'tags' => ['portrait', 'clean']],
                ['seed' => 'portrait-5', 'category' => 'Lifestyle', 'tags' => ['natural-light', 'brand']],
                ['seed' => 'portrait-6', 'category' => 'Studio', 'tags' => ['headshot', 'studio']],
            ],
            'commercial' => [
                ['seed' => 'commercial-1', 'category' => 'Campaign', 'tags' => ['fashion', 'campaign']],
                ['seed' => 'commercial-2', 'category' => 'Product', 'tags' => ['product', 'editorial']],
                ['seed' => 'commercial-3', 'category' => 'Lifestyle', 'tags' => ['brand', 'story']],
                ['seed' => 'commercial-4', 'category' => 'Campaign', 'tags' => ['lookbook', 'fashion']],
                ['seed' => 'commercial-5', 'category' => 'Details', 'tags' => ['texture', 'product']],
                ['seed' => 'commercial-6', 'category' => 'Lifestyle', 'tags' => ['travel', 'brand']],
            ],
        ];

        $photoSet = collect($themes[$theme] ?? [])->map(function (array $item, int $index) use ($project, $theme) {
            return Photo::create([
                'project_id' => $project->id,
                'url' => "https://picsum.photos/seed/{$item['seed']}/1600/1200",
                'thumbnail_url' => "https://picsum.photos/seed/{$item['seed']}/640/480",
                'optimized_path' => null,
                'original_path' => null,
                'optimized_bytes' => 420000 + ($index * 12000),
                'original_bytes' => 2500000 + ($index * 80000),
                'mime_type' => 'image/jpeg',
                'is_selected' => $index < 2,
                'download_count' => $index,
                'order_index' => $index + 1,
                'category' => $item['category'],
                'show_on_website' => $index < 4,
                'tags' => $item['tags'],
            ]);
        });

        $heroPhoto = $photoSet->first();

        if ($heroPhoto) {
            $project->update([
                'hero_photo_id' => $heroPhoto->id,
                'hero_focus_x' => '50%',
                'hero_focus_y' => '42%',
                'website_category' => match ($theme) {
                    'wedding' => 'Wedding',
                    'portrait' => 'Portrait',
                    'commercial' => 'Commercial',
                    default => 'Featured',
                },
                'website_description' => match ($theme) {
                    'wedding' => 'Stories with emotion, movement, and clean editorial light.',
                    'portrait' => 'Portrait sessions with direction, atmosphere, and brand clarity.',
                    'commercial' => 'Campaign and branded imagery designed to feel elevated and useful.',
                    default => 'Selected work for the website portfolio.',
                },
            ]);
        }
    }
}
