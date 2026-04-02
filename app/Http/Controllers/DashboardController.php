<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Setting;
use App\Support\InstallationPlan;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
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
        ]);
    }
}
