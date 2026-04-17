<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use App\Models\Project;
use App\Support\Tenancy\TenantContext;
use App\Support\CalendarAvailability;
use App\Support\EventTypeSettings;
use App\Support\HomepageSettings;
use App\Support\TenantThemeSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        if ($this->isCentralDomain($request)) {
            return Inertia::render('Public/SaasLanding', [
                'platform' => $this->marketingPayload(),
            ]);
        }

        $tenantId = app(TenantContext::class)->id();
        $homepage = HomepageSettings::toFrontend(HomepageSettings::get($tenantId));
        $theme = TenantThemeSettings::get($tenantId);
        $portfolioPhotos = collect();

        if (Schema::hasTable('photos')) {
            $portfolioPhotos = Photo::query()
                ->where('show_on_website', true)
                ->with('project.lead')
                ->latest()
                ->get()
                ->map(function (Photo $photo) {
                    $project = $photo->project;
                    $category = $project?->website_category ?: $project?->lead?->event_type ?: 'Featured';

                    return [
                        'id' => $photo->id,
                        'image_url' => $photo->optimized_path
                            ? $this->temporaryUrlOrFallback($photo->optimized_path)
                            : $photo->url,
                        'project_name' => $project?->name,
                        'category' => $category,
                        'description' => $project?->website_description ?: $photo->category,
                    ];
                })
                ->values();
        }

        $portfolioCategories = $portfolioPhotos
            ->pluck('category')
            ->filter()
            ->unique()
            ->values();

        return Inertia::render('Public/Home', [
            'homepage' => $homepage,
            'theme' => $theme,
            'portfolioPhotos' => $portfolioPhotos,
            'portfolioCategories' => $portfolioCategories,
            'eventTypes' => EventTypeSettings::get(),
            'busyCalendarEvents' => CalendarAvailability::busyEvents(),
            'businessHours' => CalendarAvailability::businessHours(),
            'availabilitySettings' => CalendarAvailability::settings(),
        ]);
    }

    public function portfolio(Request $request)
    {
        $tenantId = app(TenantContext::class)->id();
        $homepage = HomepageSettings::toFrontend(HomepageSettings::get($tenantId));
        $theme = TenantThemeSettings::get($tenantId);
        $selectedCategory = trim((string) $request->query('category', ''));

        $projectQuery = Project::query()
            ->whereHas('photos', fn ($query) => $query->where('show_on_website', true))
            ->with([
                'lead',
                'heroPhoto',
                'photos' => fn ($query) => $query
                    ->where('show_on_website', true)
                    ->orderBy('order_index')
                    ->orderByDesc('id'),
            ])
            ->latest();

        if ($selectedCategory !== '') {
            $projectQuery->where(function ($query) use ($selectedCategory) {
                $query->where('website_category', $selectedCategory)
                    ->orWhere('website_category', 'like', '%'.$selectedCategory.'%')
                    ->orWhereHas('lead', fn ($leadQuery) => $leadQuery
                        ->where('event_type', $selectedCategory)
                        ->orWhere('event_type', 'like', '%'.$selectedCategory.'%'));
            });
        }

        $projects = $projectQuery->paginate(9)->withQueryString();

        $categories = Project::query()
            ->whereHas('photos', fn ($query) => $query->where('show_on_website', true))
            ->with('lead')
            ->get()
            ->map(fn (Project $project) => $project->website_category ?: $project->lead?->event_type)
            ->filter()
            ->unique()
            ->values();

        return Inertia::render('Public/Portfolio', [
            'homepage' => $homepage,
            'theme' => $theme,
            'selectedCategory' => $selectedCategory,
            'categories' => $categories,
            'projects' => $projects->through(function (Project $project) {
                $coverPhoto = $project->heroPhoto ?: $project->photos->first();

                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'category' => $project->website_category ?: $project->lead?->event_type ?: 'Featured',
                    'description' => $project->website_description ?: $coverPhoto?->category ?: 'Coleccion publicada en el portafolio del estudio.',
                    'gallery_url' => $project->gallery_token ? route('public.gallery.show', $project->gallery_token) : null,
                    'image_url' => $coverPhoto?->optimized_path
                        ? $this->temporaryUrlOrFallback($coverPhoto->optimized_path)
                        : $coverPhoto?->url,
                    'photos_count' => $project->photos->count(),
                    'event_date' => optional($project->event_date)?->toDateString(),
                ];
            }),
            'pagination' => [
                'current_page' => $projects->currentPage(),
                'last_page' => $projects->lastPage(),
                'per_page' => $projects->perPage(),
                'total' => $projects->total(),
            ],
        ]);
    }

    private function isCentralDomain(Request $request): bool
    {
        $host = strtolower((string) $request->getHost());

        return in_array($host, Arr::wrap(config('saas.central_domains', [])), true);
    }

    private function marketingPayload(): array
    {
        return [
            'name' => 'PhotOS',
            'eyebrow' => 'SaaS para fotografos y estudios',
            'headline' => 'Galerias, CRM, contratos, facturacion y portal cliente en una sola plataforma.',
            'subheadline' => 'Convierte tu dominio en una experiencia premium para clientes y administra toda tu operacion sin salir del mismo sistema.',
            'primary_cta' => '/login',
            'secondary_cta' => '#pricing',
            'navigation' => [
                ['label' => 'Producto', 'target' => '#product'],
                ['label' => 'Funciones', 'target' => '#features'],
                ['label' => 'Planes', 'target' => '#pricing'],
                ['label' => 'FAQ', 'target' => '#faq'],
            ],
            'feature_highlights' => [
                ['title' => 'Galerias inteligentes', 'description' => 'Publicas o privadas, con favoritos, descargas, acceso por cliente y reconocimiento facial opcional.'],
                ['title' => 'Operacion completa', 'description' => 'Leads, agenda, briefing, contratos, facturas, estado de cuenta y automatizaciones en el mismo flujo.'],
                ['title' => 'White-label real', 'description' => 'Cada estudio usa su propio dominio, branding, home, portafolio y experiencia de cliente sin duplicar codigo.'],
            ],
            'products' => [
                ['name' => 'CRM y agenda', 'copy' => 'Captura leads, califica oportunidades y coordina disponibilidad real desde un panel unificado.'],
                ['name' => 'Galerias premium', 'copy' => 'Entrega fotos con una experiencia cuidada, acceso privado, likes, descargas y filtros por persona.'],
                ['name' => 'Finanzas y contratos', 'copy' => 'Maneja contratos, pagos parciales, facturas y seguimiento financiero por cliente y proyecto.'],
                ['name' => 'Automatizacion', 'copy' => 'Dispara tareas, correos y acciones por evento sin depender de herramientas externas.'],
            ],
            'plans' => [
                ['name' => 'Basic Vault', 'price' => '$0', 'description' => 'Boveda B2C para fotografos sociales que solo necesitan almacenamiento y galeria.', 'items' => ['300 GB de originales', 'IA desactivada', 'Galerias publicas y privadas']],
                ['name' => 'AI Starter', 'price' => '$29', 'description' => 'Entrada B2C con reconocimiento facial y hasta 2,000 fotos por mes.', 'items' => ['2,000 fotos por mes', 'Reconocimiento facial', 'Sin patrocinadores'], 'featured' => true],
                ['name' => 'AI Pro', 'price' => '$79', 'description' => 'Plan B2B para eventos corporativos y deportivos con hasta 20 patrocinadores por evento.', 'items' => ['6,000 fotos por mes', 'Rostros y patrocinadores', 'Dominio propio']],
                ['name' => 'AI Business', 'price' => '$149', 'description' => 'Mas volumen, mas staff y hasta 50 patrocinadores por evento.', 'items' => ['20,000 fotos por mes', 'Rostros y patrocinadores', 'Cloudflare for SaaS']],
            ],
            'faq' => [
                ['question' => 'Puedo usar mi propio dominio?', 'answer' => 'Si. El sistema ya esta preparado para dominios custom con Cloudflare for SaaS y onboarding guiado.'],
                ['question' => 'Cada fotografo tiene su propio home?', 'answer' => 'Si. El dominio principal vende la plataforma y cada tenant conserva su home, galerias, branding y contenido por separado.'],
                ['question' => 'Sirve para estudios y no solo para un fotografo?', 'answer' => 'Si. La arquitectura soporta tenants, presets, multiusuario y crecimiento hacia SaaS white-label.'],
            ],
        ];
    }

    private function temporaryUrlOrFallback(string $path): string
    {
        try {
            return \Illuminate\Support\Facades\Storage::disk('r2')->temporaryUrl($path, now()->addMinutes(60));
        } catch (\Throwable $e) {
            return $path;
        }
    }
}
