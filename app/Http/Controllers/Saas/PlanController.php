<?php

namespace App\Http\Controllers\Saas;

use App\Http\Controllers\Controller;
use App\Models\SaasPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Saas/Plans/Index', [
            'plans' => SaasPlan::orderBy('id')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:saas_plans,code',
            'name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
            'features' => 'nullable|array',
        ]);

        SaasPlan::create($validated);

        return back()->with('success', 'Plan creado correctamente.');
    }

    public function update(Request $request, SaasPlan $plan)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
            'features' => 'nullable|array',
        ]);

        $plan->update($validated);

        return back()->with('success', 'Plan actualizado.');
    }

    public function destroy(SaasPlan $plan)
    {
        // Prevent deleting core plans used by existing tenants?
        $plan->delete();
        return back()->with('success', 'Plan eliminado.');
    }
}
