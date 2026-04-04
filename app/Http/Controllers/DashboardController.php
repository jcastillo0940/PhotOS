<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Setting;
use App\Support\EventTypeSettings;
use App\Support\InstallationPlan;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $eventTypes = EventTypeSettings::get();
        $leads = Lead::query()->get();
        $projects = Project::query()->with('lead')->get();
        $events = Event::query()->with('project.lead')->get();

        $eventReports = collect($eventTypes)->map(function (string $type) use ($leads, $projects, $events) {
            $projectsForType = $projects->filter(fn (Project $project) => $project->lead?->event_type === $type);

            return [
                'type' => $type,
                'leads_count' => $leads->where('event_type', $type)->count(),
                'projects_count' => $projectsForType->count(),
                'revenue' => (float) $projectsForType->sum(
                    fn (Project $project) => $project->invoices->where('status', 'paid')->sum('amount')
                ),
                'upcoming_events_count' => $events
                    ->filter(fn (Event $event) => $event->start && $event->start->greaterThanOrEqualTo(now()))
                    ->filter(fn (Event $event) => $event->project?->lead?->event_type === $type)
                    ->count(),
            ];
        })->values();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'leads_count' => Lead::where('status', 'lead')->count(),
                'active_projects' => Project::where('status', '!=', 'delivered')->count(),
                'next_event' => Event::where('start', '>=', now())->with('project')->orderBy('start')->first(),
                'total_revenue' => Project::with('invoices')->get()->sum(fn ($p) => $p->invoices->where('status', 'paid')->sum('amount')),
            ],
            'system' => [
                'r2_status' => !empty(Setting::get('r2_key')),
                'paypal_status' => !empty(Setting::get('paypal_client_id')),
                'tilopay_status' => !empty(Setting::get('tilopay_api_key')),
            ],
            'plans' => array_values(InstallationPlan::all()),
            'currentPlanCode' => InstallationPlan::code(),
            'technicalSummary' => config('photography_plans.technical_summary', []),
            'eventTypes' => $eventTypes,
            'eventReports' => $eventReports,
        ]);
    }
}
