<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\GeminiUsageRecord;
use App\Models\Lead;
use App\Models\Project;
use App\Models\SaasPlan;
use App\Models\SaasCostEntry;
use App\Models\SaasRegistration;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantSubscription;
use App\Models\TenantSubscriptionTransaction;
use App\Models\User;
use App\Support\EventTypeSettings;
use App\Support\InstallationPlan;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
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
        $monthlyRecurringRevenue = (float) $subscriptions
            ->where('status', 'active')
            ->sum(fn (TenantSubscription $subscription) => $subscription->billing_cycle === 'annual'
                ? ((float) $subscription->amount / 12)
                : (float) $subscription->amount);

        $collectedRevenue = (float) TenantSubscriptionTransaction::query()
            ->where('status', 'completed')
            ->sum('amount');

        $currentMonthRevenue = (float) TenantSubscriptionTransaction::query()
            ->where('status', 'completed')
            ->where(function ($query) {
                $query
                    ->whereBetween('occurred_at', [now()->startOfMonth(), now()->endOfMonth()])
                    ->orWhere(function ($fallbackQuery) {
                        $fallbackQuery
                            ->whereNull('occurred_at')
                            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()]);
                    });
            })
            ->sum('amount');

        $exactGeminiCost = (float) GeminiUsageRecord::query()
            ->where('is_estimated', false)
            ->sum('total_cost_usd');

        $estimatedGeminiCost = (float) GeminiUsageRecord::query()
            ->where('is_estimated', true)
            ->sum('total_cost_usd');

        $currentMonthGeminiCost = (float) GeminiUsageRecord::query()
            ->where('is_estimated', false)
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->sum('total_cost_usd');

        $manualActualCost = (float) SaasCostEntry::query()
            ->where('cost_type', 'actual')
            ->sum('amount_usd');

        $manualEstimatedCost = (float) SaasCostEntry::query()
            ->where('cost_type', 'estimated')
            ->sum('amount_usd');

        $currentMonthManualActualCost = (float) SaasCostEntry::query()
            ->where('cost_type', 'actual')
            ->whereDate('period_start', now()->startOfMonth()->toDateString())
            ->sum('amount_usd');

        $currentMonthManualEstimatedCost = (float) SaasCostEntry::query()
            ->where('cost_type', 'estimated')
            ->whereDate('period_start', now()->startOfMonth()->toDateString())
            ->sum('amount_usd');

        $grossProfit = $collectedRevenue - ($exactGeminiCost + $manualActualCost);
        $currentMonthGrossProfit = $currentMonthRevenue - ($currentMonthGeminiCost + $currentMonthManualActualCost);
        $grossMarginPct = $collectedRevenue > 0
            ? round(($grossProfit / $collectedRevenue) * 100, 2)
            : null;

        $months = collect(range(5, 0, -1))
            ->map(fn (int $offset) => now()->copy()->startOfMonth()->subMonths($offset))
            ->push(now()->copy()->startOfMonth())
            ->values();

        $paymentsByMonth = TenantSubscriptionTransaction::query()
            ->where('status', 'completed')
            ->selectRaw(
                "DATE_FORMAT(COALESCE(occurred_at, created_at), '%Y-%m-01') as month_key, SUM(amount) as total"
            )
            ->groupBy('month_key')
            ->pluck('total', 'month_key');

        $costsByMonth = GeminiUsageRecord::query()
            ->where('is_estimated', false)
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m-01') as month_key, SUM(total_cost_usd) as total")
            ->groupBy('month_key')
            ->pluck('total', 'month_key');

        $manualCostsByMonth = SaasCostEntry::query()
            ->where('cost_type', 'actual')
            ->selectRaw("DATE_FORMAT(period_start, '%Y-%m-01') as month_key, SUM(amount_usd) as total")
            ->groupBy('month_key')
            ->pluck('total', 'month_key');

        $manualEstimatedByMonth = SaasCostEntry::query()
            ->where('cost_type', 'estimated')
            ->selectRaw("DATE_FORMAT(period_start, '%Y-%m-01') as month_key, SUM(amount_usd) as total")
            ->groupBy('month_key')
            ->pluck('total', 'month_key');

        $monthlyFinance = $months->map(function (Carbon $month) use ($paymentsByMonth, $costsByMonth, $manualCostsByMonth, $manualEstimatedByMonth) {
            $key = $month->format('Y-m-01');
            $revenue = (float) ($paymentsByMonth[$key] ?? 0);
            $geminiCost = (float) ($costsByMonth[$key] ?? 0);
            $manualActual = (float) ($manualCostsByMonth[$key] ?? 0);
            $manualEstimated = (float) ($manualEstimatedByMonth[$key] ?? 0);
            $cost = $geminiCost + $manualActual;

            return [
                'label' => $month->translatedFormat('M Y'),
                'revenue_usd' => round($revenue, 2),
                'cost_usd' => round($cost, 6),
                'gemini_cost_usd' => round($geminiCost, 6),
                'manual_actual_cost_usd' => round($manualActual, 4),
                'manual_estimated_cost_usd' => round($manualEstimated, 4),
                'profit_usd' => round($revenue - $cost, 6),
            ];
        })->values();

        $revenueByTenant = TenantSubscriptionTransaction::query()
            ->where('status', 'completed')
            ->select('tenant_id', DB::raw('SUM(amount) as revenue_usd'))
            ->groupBy('tenant_id')
            ->pluck('revenue_usd', 'tenant_id');

        $costByTenant = GeminiUsageRecord::query()
            ->where('is_estimated', false)
            ->select('tenant_id', DB::raw('SUM(total_cost_usd) as cost_usd'))
            ->groupBy('tenant_id')
            ->pluck('cost_usd', 'tenant_id');

        $tenantFinance = $tenants
            ->map(function (Tenant $tenant) use ($revenueByTenant, $costByTenant) {
                $revenue = (float) ($revenueByTenant[$tenant->id] ?? 0);
                $cost = (float) ($costByTenant[$tenant->id] ?? 0);
                $profit = $revenue - $cost;

                return [
                    'tenant_id' => $tenant->id,
                    'tenant_name' => $tenant->name,
                    'tenant_slug' => $tenant->slug,
                    'plan_code' => $tenant->plan_code,
                    'status' => $tenant->status,
                    'revenue_usd' => round($revenue, 2),
                    'cost_usd' => round($cost, 6),
                    'profit_usd' => round($profit, 6),
                    'margin_pct' => $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null,
                ];
            })
            ->filter(fn (array $tenant) => $tenant['revenue_usd'] > 0 || $tenant['cost_usd'] > 0)
            ->sortByDesc('profit_usd')
            ->values();

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
                'monthly_recurring_revenue' => $monthlyRecurringRevenue,
            ],
            'finance' => [
                'collected_revenue_usd' => round($collectedRevenue, 2),
                'current_month_revenue_usd' => round($currentMonthRevenue, 2),
                'exact_gemini_cost_usd' => round($exactGeminiCost, 6),
                'estimated_legacy_cost_usd' => round($estimatedGeminiCost, 6),
                'manual_actual_cost_usd' => round($manualActualCost, 4),
                'manual_estimated_cost_usd' => round($manualEstimatedCost, 4),
                'current_month_gemini_cost_usd' => round($currentMonthGeminiCost, 6),
                'current_month_manual_actual_cost_usd' => round($currentMonthManualActualCost, 4),
                'current_month_manual_estimated_cost_usd' => round($currentMonthManualEstimatedCost, 4),
                'total_actual_operating_cost_usd' => round($exactGeminiCost + $manualActualCost, 6),
                'gross_profit_usd' => round($grossProfit, 6),
                'current_month_gross_profit_usd' => round($currentMonthGrossProfit, 6),
                'gross_margin_pct' => $grossMarginPct,
                'monthly' => $monthlyFinance,
                'tenants' => $tenantFinance->take(10)->values(),
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
