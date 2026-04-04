<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use App\Support\CalendarAvailability;
use App\Support\EventTypeSettings;
use App\Support\HomepageSettings;
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

    private function temporaryUrlOrFallback(string $path): string
    {
        try {
            return \Illuminate\Support\Facades\Storage::disk('r2')->temporaryUrl($path, now()->addMinutes(60));
        } catch (\Throwable $e) {
            return $path;
        }
    }
}
