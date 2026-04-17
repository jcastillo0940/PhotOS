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
            'plans' => SaasPlan::orderBy('id')->get()->map(function (SaasPlan $plan) {
                $definition = $plan->resolvedDefinition();

                return [
                    'id' => $plan->id,
                    'code' => $plan->code,
                    'name' => $plan->name,
                    'is_active' => $plan->is_active,
                    'features' => $plan->resolvedFeatures(),
                    'segment' => $definition['segment'] ?? null,
                    'price_monthly' => $definition['price_monthly'] ?? 0,
                    'price_yearly' => $definition['price_yearly'] ?? 0,
                    'price_monthly_promo' => $definition['price_monthly_promo'] ?? null,
                    'price_yearly_promo' => $definition['price_yearly_promo'] ?? null,
                ];
            })->values(),
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
