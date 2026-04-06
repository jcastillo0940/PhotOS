<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use App\Models\Project;
use App\Support\CalendarAvailability;
use App\Support\EventTypeSettings;
use App\Support\HomepageSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $homepage = HomepageSettings::toFrontend(HomepageSettings::get());
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
        $homepage = HomepageSettings::toFrontend(HomepageSettings::get());
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
            'selectedCategory' => $selectedCategory,
            'categories' => $categories,
            'projects' => $projects->through(function (Project $project) {
                $coverPhoto = $project->heroPhoto
                    ?: $project->photos->first();

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

    private function temporaryUrlOrFallback(string $path): string
    {
        try {
            return \Illuminate\Support\Facades\Storage::disk('r2')->temporaryUrl($path, now()->addMinutes(60));
        } catch (\Throwable $e) {
            return $path;
        }
    }
}
