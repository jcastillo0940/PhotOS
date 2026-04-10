<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Lead;
use App\Models\Project;
use App\Models\SaasPlan;
use App\Models\SaasRegistration;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantSubscription;
use App\Models\User;
use App\Support\EventTypeSettings;
use App\Support\InstallationPlan;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        if (request()->user()?->isDeveloper()) {
            return $this->saasDashboard();
        }

        if (request()->user()?->isPhotographer()) {
            return redirect()->route('admin.projects');
        }

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

    private function saasDashboard()
    {
        $tenants = Tenant::query()->with('primaryDomain')->orderByDesc('id')->get();
        $users = User::withoutGlobalScope('tenant')->orderByDesc('id')->get();
        $subscriptions = TenantSubscription::query()->orderByDesc('id')->get();
        $registrations = SaasRegistration::withoutGlobalScopes()->orderByDesc('id')->limit(8)->get();
        $plans = SaasPlan::query()->orderBy('id')->get();

        return Inertia::render('Admin/Saas/Dashboard', [
            'stats' => [
                'tenants_total' => $tenants->count(),
                'active_tenants' => $tenants->where('status', 'active')->count(),
                'custom_domains_total' => TenantDomain::query()->where('type', 'custom')->count(),
                'users_total' => $users->count(),
                'owners_total' => $users->whereIn('role', ['owner', 'developer'])->count(),
                'tenant_users_total' => $users->where('role', 'photographer')->count(),
                'active_subscriptions' => $subscriptions->where('status', 'active')->count(),
                'past_due_subscriptions' => $subscriptions->where('status', 'past_due')->count(),
                'suspended_subscriptions' => $subscriptions->whereIn('status', ['suspended', 'force_suspended'])->count(),
                'monthly_recurring_revenue' => (float) $subscriptions
                    ->where('status', 'active')
                    ->sum(fn (TenantSubscription $subscription) => $subscription->billing_cycle === 'annual'
                        ? ((float) $subscription->amount / 12)
                        : (float) $subscription->amount),
            ],
            'system' => [
                'r2_status' => !empty(Setting::get('r2_key')),
                'paypal_status' => !empty(Setting::get('paypal_client_id')),
                'alanube_status' => !empty(Setting::get('alanube_api_key')),
                'cloudflare_status' => !empty(Setting::get('cloudflare_saas_api_token')),
            ],
            'tenants' => $tenants->take(8)->map(fn (Tenant $tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'status' => $tenant->status,
                'plan_code' => $tenant->plan_code,
                'hostname' => $tenant->primaryDomain?->hostname,
            ])->values(),
            'users' => $users->take(10)->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'tenant_id' => $user->tenant_id,
            ])->values(),
            'plans' => $plans->map(fn (SaasPlan $plan) => [
                'id' => $plan->id,
                'code' => $plan->code,
                'name' => $plan->name,
                'is_active' => $plan->is_active,
                'features' => $plan->features,
                'tenants_count' => $tenants->where('plan_code', $plan->code)->count(),
            ])->values(),
            'registrations' => $registrations->map(fn (SaasRegistration $registration) => [
                'id' => $registration->id,
                'studio_name' => $registration->studio_name,
                'owner_email' => $registration->owner_email,
                'status' => $registration->status,
                'plan_code' => $registration->plan_code,
                'payment_gateway' => $registration->payment_gateway,
                'requested_domain' => $registration->requested_domain,
                'provisioned_hostname' => $registration->provisioned_hostname,
                'created_at' => optional($registration->created_at)?->toIso8601String(),
            ])->values(),
        ]);
    }
}
