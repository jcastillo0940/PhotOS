<?php

namespace App\Http\Controllers\Saas;

use App\Http\Controllers\Controller;
use App\Models\SaasCostEntry;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CostController extends Controller
{
    private const PRODUCT_OPTIONS = [
        ['provider' => 'google', 'service' => 'compute-engine-vm', 'label' => 'Google Cloud VM'],
        ['provider' => 'google', 'service' => 'gemini-developer-api', 'label' => 'Gemini Developer API'],
        ['provider' => 'google', 'service' => 'cloud-storage', 'label' => 'Google Cloud Storage'],
        ['provider' => 'google', 'service' => 'bigquery', 'label' => 'BigQuery'],
        ['provider' => 'cloudflare', 'service' => 'r2', 'label' => 'Cloudflare R2'],
        ['provider' => 'cloudflare', 'service' => 'cloudflare-for-saas', 'label' => 'Cloudflare for SaaS'],
        ['provider' => 'cloudflare', 'service' => 'images', 'label' => 'Cloudflare Images'],
        ['provider' => 'cloudflare', 'service' => 'stream', 'label' => 'Cloudflare Stream'],
        ['provider' => 'email', 'service' => 'smtp', 'label' => 'SMTP / correo transaccional'],
        ['provider' => 'meta', 'service' => 'whatsapp', 'label' => 'WhatsApp'],
        ['provider' => 'twilio', 'service' => 'whatsapp', 'label' => 'Twilio WhatsApp'],
        ['provider' => 'paypal', 'service' => 'fees', 'label' => 'Comisiones PayPal'],
        ['provider' => 'manual', 'service' => 'other', 'label' => 'Otro costo manual'],
    ];

    public function index()
    {
        $entries = SaasCostEntry::query()
            ->with('recordedBy:id,name')
            ->orderByDesc('period_start')
            ->orderBy('provider')
            ->orderBy('service')
            ->get();

        $currentMonth = now()->startOfMonth();
        $stats = [
            'actual_total_usd' => (float) $entries->where('cost_type', 'actual')->sum('amount_usd'),
            'estimated_total_usd' => (float) $entries->where('cost_type', 'estimated')->sum('amount_usd'),
            'current_month_actual_usd' => (float) $entries
                ->where('cost_type', 'actual')
                ->where('period_start', $currentMonth)
                ->sum('amount_usd'),
            'current_month_estimated_usd' => (float) $entries
                ->where('cost_type', 'estimated')
                ->where('period_start', $currentMonth)
                ->sum('amount_usd'),
        ];

        $monthly = $entries
            ->groupBy(fn (SaasCostEntry $entry) => $entry->period_start->format('Y-m'))
            ->map(function ($monthEntries, $month) {
                $period = Carbon::createFromFormat('Y-m', $month)->startOfMonth();

                return [
                    'month' => $month,
                    'label' => $period->translatedFormat('M Y'),
                    'actual_usd' => (float) $monthEntries->where('cost_type', 'actual')->sum('amount_usd'),
                    'estimated_usd' => (float) $monthEntries->where('cost_type', 'estimated')->sum('amount_usd'),
                ];
            })
            ->sortByDesc('month')
            ->values();

        return Inertia::render('Admin/Saas/Costs/Index', [
            'entries' => $entries->map(fn (SaasCostEntry $entry) => [
                'id' => $entry->id,
                'period_start' => optional($entry->period_start)?->format('Y-m-d'),
                'provider' => $entry->provider,
                'service' => $entry->service,
                'cost_type' => $entry->cost_type,
                'amount_usd' => (float) $entry->amount_usd,
                'source' => $entry->source,
                'notes' => $entry->notes,
                'recorded_by' => $entry->recordedBy?->name,
                'created_at' => optional($entry->created_at)?->toIso8601String(),
            ])->values(),
            'stats' => $stats,
            'monthly' => $monthly,
            'productOptions' => self::PRODUCT_OPTIONS,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'period_start' => 'required|date',
            'provider' => 'required|string|max:100',
            'service' => 'required|string|max:120',
            'cost_type' => 'required|string|in:actual,estimated',
            'amount_usd' => 'required|numeric|min:0',
            'source' => 'nullable|string|max:30',
            'notes' => 'nullable|string|max:5000',
        ]);

        SaasCostEntry::create([
            'period_start' => Carbon::parse($validated['period_start'])->startOfMonth()->toDateString(),
            'provider' => trim((string) $validated['provider']),
            'service' => trim((string) $validated['service']),
            'cost_type' => $validated['cost_type'],
            'amount_usd' => $validated['amount_usd'],
            'source' => trim((string) ($validated['source'] ?? 'manual')) ?: 'manual',
            'notes' => filled($validated['notes'] ?? null) ? trim((string) $validated['notes']) : null,
            'recorded_by_user_id' => $request->user()?->id,
        ]);

        return back()->with('success', 'Costo mensual guardado.');
    }

    public function update(Request $request, SaasCostEntry $cost)
    {
        $validated = $request->validate([
            'period_start' => 'required|date',
            'provider' => 'required|string|max:100',
            'service' => 'required|string|max:120',
            'cost_type' => 'required|string|in:actual,estimated',
            'amount_usd' => 'required|numeric|min:0',
            'source' => 'nullable|string|max:30',
            'notes' => 'nullable|string|max:5000',
        ]);

        $cost->update([
            'period_start' => Carbon::parse($validated['period_start'])->startOfMonth()->toDateString(),
            'provider' => trim((string) $validated['provider']),
            'service' => trim((string) $validated['service']),
            'cost_type' => $validated['cost_type'],
            'amount_usd' => $validated['amount_usd'],
            'source' => trim((string) ($validated['source'] ?? 'manual')) ?: 'manual',
            'notes' => filled($validated['notes'] ?? null) ? trim((string) $validated['notes']) : null,
            'recorded_by_user_id' => $request->user()?->id,
        ]);

        return back()->with('success', 'Costo mensual actualizado.');
    }

    public function destroy(SaasCostEntry $cost)
    {
        $cost->delete();

        return back()->with('success', 'Costo mensual eliminado.');
    }
}
