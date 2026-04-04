<?php

namespace App\Http\Controllers;

use App\Support\InstallationPlan;
use Inertia\Inertia;

class LimitsController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Limits/Index', [
            'plans' => array_values(InstallationPlan::all()),
            'currentPlanCode' => InstallationPlan::code(),
            'currentPlan' => InstallationPlan::current(),
            'technicalSummary' => config('photography_plans.technical_summary', []),
        ]);
    }
}
