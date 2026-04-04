<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeadController extends Controller
{
    public function create()
    {
        return Inertia::render('Admin/Leads/Create');
    }

    public function index()
    {
        return Inertia::render('Admin/Leads/Index', [
            'leads' => Lead::latest()->get(),
        ]);
    }

    public function show(Lead $lead)
    {
        return Inertia::render('Admin/Leads/Show', [
            'lead' => $lead,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'event_type' => 'required|string',
            'tentative_date' => 'nullable|date',
            'phone' => 'nullable|string|max:50',
            'message' => 'nullable|string|max:2000',
            'client_document' => 'nullable|string|max:255',
        ]);

        $lead = Lead::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'event_type' => $validated['event_type'],
            'tentative_date' => $validated['tentative_date'] ?? null,
            'responses' => [
                'phone' => $validated['phone'] ?? null,
                'message' => $validated['message'] ?? null,
                'client_document' => $validated['client_document'] ?? null,
            ],
            'status' => 'lead',
        ]);

        if ($request->routeIs('admin.leads.store')) {
            return redirect()->route('admin.leads.show', $lead)->with('success', 'Lead creado correctamente.');
        }

        return redirect()->back()->with('success', 'Thank you! We\'ll be in touch soon.');
    }

    public function updateStatus(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:lead,qualified,project,lost',
        ]);

        $lead->update($validated);

        return redirect()->back();
    }
}
