<?php

namespace App\Http\Controllers\Saas;

use App\Http\Controllers\Controller;
use App\Models\TenantSubscriptionTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = TenantSubscriptionTransaction::with(['tenant', 'subscription'])
            ->latest();

        if ($request->has('provider')) {
            $query->where('provider', $request->provider);
        }

        return Inertia::render('Admin/Saas/Payments/Index', [
            'transactions' => $query->paginate(20),
            'stats' => [
                'total_amount' => TenantSubscriptionTransaction::where('status', 'completed')->sum('amount'),
                'paypal_total' => TenantSubscriptionTransaction::where('provider', 'paypal')->where('status', 'completed')->sum('amount'),
                'manual_total' => TenantSubscriptionTransaction::where('provider', 'manual')->where('status', 'completed')->sum('amount'),
            ]
        ]);
    }
}
