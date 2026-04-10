<?php

namespace App\Http\Controllers\Saas;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\SaasPlan;
use App\Models\TenantSubscription;
use App\Models\TenantSubscriptionTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Saas/Subscriptions/Index', [
            'subscriptions' => TenantSubscription::with('tenant:id,name')
                ->latest()
                ->get(),
            'tenants' => Tenant::orderBy('name')->get(['id', 'name']),
            'plans' => SaasPlan::where('is_active', true)->get(['code', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'plan_code' => 'required|string|exists:saas_plans,code',
            'billing_cycle' => 'required|string|in:monthly,yearly',
            'amount' => 'required|numeric',
            'currency' => 'required|string|max:10',
            'status' => 'required|string|in:active,pending,past_due,canceled',
            'current_period_ends_at' => 'nullable|date',
        ]);

        TenantSubscription::create(array_merge($validated, [
            'provider' => 'manual',
            'payment_mode' => 'offline',
            'starts_at' => now(),
        ]));

        return back()->with('success', 'Suscripcion manual creada.');
    }

    public function update(Request $request, TenantSubscription $subscription)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:active,pending,past_due,canceled',
            'plan_code' => 'required|string|exists:saas_plans,code',
            'amount' => 'required|numeric',
            'current_period_ends_at' => 'nullable|date',
            'manual_override_status' => 'nullable|string',
            'manual_override_reason' => 'nullable|string',
        ]);

        $subscription->update($validated);

        return back()->with('success', 'Suscripcion actualizada.');
    }

    public function recordManualPayment(Request $request, TenantSubscription $subscription)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric',
            'reference' => 'nullable|string',
            'occurred_at' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        TenantSubscriptionTransaction::create([
            'tenant_id' => $subscription->tenant_id,
            'tenant_subscription_id' => $subscription->id,
            'provider' => 'manual',
            'type' => 'payment_manual',
            'status' => 'completed',
            'amount' => $validated['amount'],
            'currency' => $subscription->currency,
            'reference' => $validated['reference'],
            'occurred_at' => $validated['occurred_at'],
            'payload' => ['notes' => $validated['notes']],
        ]);

        // Extend subscription?
        if ($subscription->current_period_ends_at) {
            $months = $subscription->billing_cycle === 'yearly' ? 12 : 1;
            $subscription->current_period_ends_at = $subscription->current_period_ends_at->addMonths($months);
            $subscription->status = 'active';
            $subscription->save();
        }

        return back()->with('success', 'Pago manual registrado y suscripcion extendida.');
    }
}
